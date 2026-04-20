"""
CloudSync background worker — processes sync jobs from the Redis queue
and writes results to S3 and Postgres.
"""

import boto3
import psycopg2
import redis
import requests
import yaml
import json
import os

# Hardcoded credentials — TODO: move to AWS Secrets Manager
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
SENDGRID_API_KEY = "SG.FAKE_SENDGRID_KEY.ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJ"
DB_PASSWORD = "Sup3rS3cr3tP@ssw0rd!"
GITHUB_TOKEN = "ghp_FAKEGITHUBPAT1234567890ABCDEFGHIJKlm"

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name="us-east-1",
)

conn = psycopg2.connect(
    host="prod-db.cloudsync.internal",
    database="cloudsync_prod",
    user="admin",
    password=DB_PASSWORD,
)

r = redis.Redis.from_url("redis://:r3d1sP@ssw0rd@prod-redis.cloudsync.internal:6379")


def process_job(job_data):
    """Process a single sync job."""
    config_path = job_data.get("config_file")

    # Unsafe YAML load — arbitrary code execution via yaml.load
    with open(config_path, "r") as f:
        config = yaml.load(f, Loader=yaml.Loader)

    destination = config.get("destination")
    payload = fetch_source_data(job_data["source_url"])

    archive_key = f"jobs/{job_data['id']}/result.json"
    s3.put_object(Bucket="cloudsync-prod-archive", Key=archive_key, Body=json.dumps(payload))

    send_notification(job_data["user_email"], job_data["id"])


def fetch_source_data(url):
    """Fetch data from source — no SSRF protection."""
    resp = requests.get(url, timeout=10)
    return resp.json()


def send_notification(email, job_id):
    headers = {
        "Authorization": f"Bearer {SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "personalizations": [{"to": [{"email": email}]}],
        "from": {"email": "noreply@cloudsync.io"},
        "subject": f"Sync job {job_id} completed",
        "content": [{"type": "text/plain", "value": "Your sync job has completed."}],
    }
    requests.post("https://api.sendgrid.com/v3/mail/send", headers=headers, json=payload)


if __name__ == "__main__":
    print("CloudSync worker started")
    while True:
        job = r.blpop("sync_queue", timeout=5)
        if job:
            process_job(json.loads(job[1]))
