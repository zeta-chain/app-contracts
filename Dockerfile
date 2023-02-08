
FROM node:16.14-alpine

ENV SHELL /bin/ash
ENV EXECUTE_PROGRAMMATICALLY=true

RUN apk add --update python3 yarn git nodejs make g++

## Install node modules before the code is copied to the container
WORKDIR /home/zetachain/
COPY package*.json ./
RUN yarn install

COPY . ./
RUN yarn install

RUN yarn add solc@0.5.10        
RUN yarn add solc@0.6.6      
RUN yarn add solc@0.7.6 
RUN yarn add solc@0.8.7

RUN cd packages/protocol-contracts && npx hardhat compile && cd -
RUN cd packages/example-contracts && npx hardhat compile && cd -
RUN cd packages/zevm-contracts && npx hardhat compile && cd -

WORKDIR /home/zetachain/

ENTRYPOINT ["ash"]

