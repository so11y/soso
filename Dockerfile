FROM node:22-alpine

WORKDIR /app

COPY . .

EXPOSE 4873

CMD ["npm","run","inside"]