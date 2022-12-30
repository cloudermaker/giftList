import { EHeader } from '../components/customHeader';
import { Layout } from '../components/layout';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import CountDown from '../components/countDown';

export const Home = (): JSX.Element => {
    return (
        <Layout selectedHeader={EHeader.Homepage}>
            <h1>Bienvenue petit lutin !!</h1>

            <span className="text-xl">
                Si tu es ici pour remplir ta lettre du père noël, tu es au bon endroit
                <FontAwesomeIcon className="pl-1" icon={faWandMagicSparkles} />
            </span>

            <div className="p-10 text-center text-3xl md:text-7xl text-orange-700 mt-[6vh]">
                <div className="bg-shadow">
                    <CountDown />
                </div>
            </div>
        </Layout>
    );
};

export default Home;
