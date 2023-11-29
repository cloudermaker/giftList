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

            <div>
                <ul>
                    <li>
                        <b className="pr-2">Pierre - Claire:</b>
                        <span className="pr-2">
                            <u>Arrivée</u>: Ven. 22 déc. 19:20
                        </span>
                        <span>
                            <u>Départ</u>: Mar. 26 déc. 16:05
                        </span>
                    </li>
                    <li>
                        <b className="pr-2">Alice - JB:</b>
                        <span className="pr-2">
                            <u>Arrivée</u>: nuit du 21 au 22
                        </span>
                        <span>
                            <u>Départ</u>: 29 matin
                        </span>
                    </li>
                    <li>
                        <b className="pr-2">Clément:</b>
                        <span className="pr-2">
                            <u>Arrivée</u>: Ven. 22 déc. 23h10
                        </span>
                        <span>
                            <u>Départ</u>: Merc. 27 déc. 12h44
                        </span>
                    </li>
                    <li>
                        <b className="pr-2">Baptite:</b>
                        <span className="pr-2">
                            <u>Arrivée</u>: ??????
                        </span>
                        <span>
                            <u>Départ</u>: ?????!!!
                        </span>
                    </li>
                </ul>
            </div>
        </Layout>
    );
};

export default Home;
