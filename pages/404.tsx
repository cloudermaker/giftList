import CustomButton from '@/components/atoms/customButton';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import Router from 'next/router';

export default function Custom404() {
    return (
        <Layout withHeader={false}>
            <SEO
                title="Page non trouvée (404) - Ma liste de cadeaux"
                description="La page que vous recherchez n'existe pas. Revenez à l'accueil pour créer ou gérer votre liste de cadeaux."
                canonicalPath="/404"
                noIndex={true}
            />
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 py-16 px-4 mb-8">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center border-2 border-vertNoel">
                    <h1 className="text-4xl font-bold text-rougeNoel mb-6">404</h1>
                    <div className="text-8xl mb-6">🎁</div>
                    <h2 className="text-2xl font-semibold mb-4">Page non trouvée</h2>
                    <p className="text-gray-600 mb-8">
                        Oups ! On dirait que la page que vous recherchez a été déballée ailleurs.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <CustomButton className="green-button" onClick={() => Router.push('/')}>
                            {"Retour à l'accueil"}
                        </CustomButton>
                        <CustomButton className="green-button" onClick={() => Router.push('/help')}>
                            {"Page d'aide"}
                        </CustomButton>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
