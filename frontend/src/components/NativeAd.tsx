// frontend/src/components/NativeAd.tsx
import Script from 'next/script';

export default function NativeAd() {
  return (
    <div className="my-6 flex w-full min-h-[100px] justify-center items-center overflow-hidden">
      {/* El contenedor donde Adsterra dibujará el anuncio */}
      <div id="container-0fa6716a3cd45287055565fcd3a06d52"></div>
      
      {/* El script de ejecución */}
      <Script
        id="adsterra-native-banner"
        src="https://pl29641065.profitableratecpmnetwork.com/0fa6716a3cd45287055565fcd3a06d52/invoke.js"
        strategy="afterInteractive"
        data-cfasync="false"
      />
    </div>
  );
}
