terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# S3 bucket — public read (misconfiguration)
resource "aws_s3_bucket" "archive" {
  bucket = "cloudsync-prod-archive"
  acl    = "public-read"

  tags = {
    Name        = "CloudSync Archive"
    Environment = "production"
  }
}

resource "aws_s3_bucket_public_access_block" "archive" {
  bucket = aws_s3_bucket.archive.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Security group — SSH and DB open to the world
resource "aws_security_group" "api" {
  name        = "cloudsync-api-sg"
  description = "CloudSync API security group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH from anywhere"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Postgres from anywhere"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Redis from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS — publicly accessible, no encryption, no deletion protection
resource "aws_db_instance" "main" {
  identifier             = "cloudsync-prod"
  engine                 = "postgres"
  engine_version         = "13.4"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  db_name                = "cloudsync_prod"
  username               = "admin"
  password               = "Sup3rS3cr3tP@ssw0rd!"
  publicly_accessible    = true
  storage_encrypted      = false
  deletion_protection    = false
  skip_final_snapshot    = true
  backup_retention_period = 0
  multi_az               = false
  vpc_security_group_ids = [aws_security_group.api.id]

  tags = {
    Environment = "production"
  }
}

# IAM role with wildcard permissions
resource "aws_iam_policy" "cloudsync_policy" {
  name = "cloudsync-api-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
      }
    ]
  })
}

# EC2 instance with IMDSv1 (metadata service vulnerability)
resource "aws_instance" "api" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.medium"

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "optional"
  }

  user_data = <<-EOF
    #!/bin/bash
    export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
    export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    cd /app && npm start
  EOF

  tags = {
    Name = "cloudsync-api"
  }
}
