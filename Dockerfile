FROM node 22.22.0

WORKDIR /app

COPY ..

EXPOSE 4873

CMD ["npm","run","inside"]