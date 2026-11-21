// URL HTTPS pública del Gateway desplegado en ECS (us-east-2).
// Se puede sobreescribir al construir la imagen con: --build-arg GATEWAY_URL=...
export const environment = {
  production: true,
  gatewayUrl: 'https://d3rcwchnofo5q2.cloudfront.net'
};
