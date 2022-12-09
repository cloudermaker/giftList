import { Layout } from '../components/layout';

const GiftList = ({ familyName }: {familyName: string}): JSX.Element => {
    return (
        <Layout>
            <h1>
                All gift list for family {familyName}
            </h1>
        </Layout>
    )
}

export default GiftList;