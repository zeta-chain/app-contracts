
FROM node:16.14-alpine

ENV SHELL /bin/ash
ENV EXECUTE_PROGRAMMATICALLY=true

RUN apk add --update python3 yarn git nodejs make g++

## Install node modules before the code is copied to the container
WORKDIR /home/zetachain/
COPY package*.json ./
COPY packages/zeta-app-contracts/package.json ./packages/zeta-app-contracts/package.json
COPY packages/zevm-app-contracts/package.json ./packages/zevm-app-contracts/package.json
RUN yarn install ; exit 0

COPY . ./
RUN yarn install 

RUN yarn add solc@0.5.10 solc@0.6.6 solc@0.7.6 solc@0.8.7

RUN cd packages/zeta-app-contracts && npx hardhat compile && cd -
RUN cd packages/zevm-app-contracts && npx hardhat compile && cd -

WORKDIR /home/zetachain/

ENTRYPOINT ["ash"]

