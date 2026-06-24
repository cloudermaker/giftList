import CustomButton from '@/components/atoms/customButton';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import Router from 'next/router';
import Image from 'next/image';

export default function Custom404() {
    return (
        <Layout withHeader={false}>
            <SEO
                title="Page non trouvée (404) - Ma liste de cadeaux"
                description="La page que vous recherchez n'existe pas. Revenez à l'accueil pour créer ou gérer votre liste de cadeaux."
                canonicalPath="/404"
                noIndex={true}
            />

            <div className="text-center mt-10">
                <p className="text-sm text-gray-500 mb-1">Erreur</p>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Page non trouvée</h1>

                <div className="mb-6 justify-self-center">
                    <video autoPlay loop muted playsInline width={300} height={300}>
                        <source src="https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.mp4" type="video/mp4" />
                    </video>
                </div>

                <p className="text-gray-600 mb-8">Oups ! On dirait que la page que vous recherchez a été déballée ailleurs.</p>

                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <CustomButton className="slate-button" onClick={() => Router.push('/')}>
                        {"Retour à l'accueil"}
                    </CustomButton>
                    <CustomButton className="slate-button" onClick={() => Router.push('/help')}>
                        {"Page d'aide"}
                    </CustomButton>
                </div>
            </div>
        </Layout>
    );
}
