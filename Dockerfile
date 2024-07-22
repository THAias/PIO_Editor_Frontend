ARG DIR=.

FROM node:lts-alpine AS builder
ARG NPM_TOKEN
ARG DIR
ENV NODE_ENV production
ENV REACT_APP_VERSION_ENV webVersion

WORKDIR /app

COPY ${DIR}/package*.json ./
RUN npm config set -- //npm.pkg.github.com/:_authToken="${NPM_TOKEN}" && npm config set @thaias:registry=https://npm.pkg.github.com
RUN npm ci --omit=dev --ignore-scripts
RUN rm -f .npmrc

COPY ${DIR} .

RUN npm run build

FROM node:lts-alpine AS editor
ENV NODE_ENV production
ENV REACT_APP_VERSION_ENV webVersion


WORKDIR /app
COPY --from=builder /app/build /app/build
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "build/", "-l", "3000"]


