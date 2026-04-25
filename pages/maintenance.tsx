import type { NextPage } from 'next';
import Head from 'next/head';
import { Logo } from '@/components/Logo';

const Maintenance: NextPage = () => {
  return (
    <>
      <Head>
        <title>Maintenance - Ma Liste de Cadeaux</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-[#fff1f2] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-card p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Logo size="large" showText={true} />
          </div>
          
          {/* Emoji Icon */}
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-rougeNoel/10 to-vertNoel/10 rounded-full flex items-center justify-center">
              <span className="text-6xl animate-wiggle">🔧</span>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Maintenance en cours
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 text-lg mb-6">
            Nous mettons à jour <strong className="text-rougeNoel">Ma Liste de Cadeaux</strong> pour vous offrir une meilleure expérience.
          </p>
          
          {/* Info Box */}
          <div className="bg-gradient-to-br from-rougeNoel/5 to-vertNoel/5 rounded-xl p-4 mb-8 border border-rougeNoel/10">
            <p className="text-sm text-gray-700">
              <strong className="text-rougeNoel">⏱️ Durée estimée :</strong> 5-10 minutes
            </p>
          </div>
          
          {/* Message */}
          <p className="text-gray-500 mb-8">
            Merci de votre patience ! 🎁✨
          </p>
          
          {/* Refresh Button */}
          <div className="mt-8">
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-rougeNoel to-rougeNoel/90 hover:from-rougeNoel/90 hover:to-rougeNoel text-white font-semibold px-8 py-3 rounded-xl shadow-gift hover:shadow-hover transition-all duration-300"
            >
              🔄 Actualiser la page
            </button>
          </div>
          
          {/* Footer */}
          <p className="text-xs text-gray-400 mt-8">
            Vous pouvez réessayer dans quelques minutes
          </p>
        </div>
      </div>
    </>
  );
};

export default Maintenance;
