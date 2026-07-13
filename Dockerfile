FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY src/ ./src/

ENV AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
ENV AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
ENV JWT_SECRET=my_super_secret_jwt_key_dont_share_this_ever_please
ENV DB_PASSWORD=Sup3rS3cr3tP@ssw0rd!

EXPOSE 3000

USER root

CMD ["node", "src/app.js"]
# rev e38243

# rev 96e724
# rev 3f333b

# rev add38b

# rev 916bdc
