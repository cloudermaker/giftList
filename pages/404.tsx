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

            <div className="item text-center w-fit justify-self-center mt-10">
                <h1 className="text-4xl font-bold text-rougeNoel mb-6">404</h1>

                <div className="mb-6 justify-self-center">
                    <Image
                        src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Y3l5cW52MGdoemV3bXR4cnEwMTN6bHZkeXplc3I5aWM0YXhiN3NzOSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/g01ZnwAUvutuK8GIQn/giphy.gif"
                        alt="Image descriptive"
                        width={300}
                        height={300}
                        unoptimized
                    />
                </div>

                <h2 className="text-2xl font-semibold mb-4">Page non trouvée</h2>

                <p className="text-gray-600 mb-8">Oups ! On dirait que la page que vous recherchez a été déballée ailleurs.</p>

                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <CustomButton className="green-button" onClick={() => Router.push('/')}>
                        {"Retour à l'accueil"}
                    </CustomButton>
                    <CustomButton className="green-button" onClick={() => Router.push('/help')}>
                        {"Page d'aide"}
                    </CustomButton>
                </div>
            </div>
        </Layout>
    );
}
