FROM node:22-alpine

WORKDIR /app

COPY . .

EXPOSE 4873

CMD ["npm","run","inside"]


#docker build -t local-npm-registry . 
#docker save -o local-npm-registry.tar local-npm-registry
#docker load -i local-npm-registry.tar