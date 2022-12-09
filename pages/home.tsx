import { EHeader } from '../components/customHeader';
import { Layout } from '../components/layout';

export const Home = (): JSX.Element => {
    // validate: check both exists
    // set cookies to remember the user ID

    return (
        <Layout  selectedHeader={EHeader.Homepage}>
            <h1>Welcome on board !!</h1>

            <div>
                <span>Please write your family name:</span>
                <input></input>
            </div>

            <div>
                <span>Please write your name:</span>
                <input></input>
            </div>

            <button>Validate</button>
        </Layout>
    )
}

export default Home;