import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ERROR 4 FIX: Permitir que next/image cargue imágenes desde picsum.photos.
  // Sin esta configuración, Next.js bloquea dominios externos por seguridad.
  // Agregar aquí cada dominio externo que uses con el componente <Image />.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
