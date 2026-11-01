FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY public public
COPY src src
RUN CI=false GENERATE_SOURCEMAP=false npm run build

FROM nginx:1.28-alpine
ENV TZ=Asia/Seoul
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
