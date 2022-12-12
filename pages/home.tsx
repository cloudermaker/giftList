import { EHeader } from '../components/customHeader';
import { Layout } from '../components/layout';

export const Home = (): JSX.Element => {
    return (
        <Layout  selectedHeader={EHeader.Homepage}>
            <h1>Welcome on board !!</h1>
        </Layout>
    )
}

export default Home;