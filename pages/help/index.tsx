import CustomButton from '@/components/atoms/customButton';
import { QuestionMarkIcon } from '@/components/icons/questionMark';
import { Layout } from '@/components/layout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Link from 'next/link';
import Router from 'next/router';

export default function Help(): JSX.Element {
    const { connectedUser } = useCurrentUser();

    return (
        <Layout withHeader={false}>
            <title>Page d&apos;aide</title>
            <h1 className="header text-center bg-white mt-8">Page d&apos;aide</h1>

            <div className="py-8 flex justify-center relative">
                <div className="bg-white w-fit h-fit rounded p-5 place-center border-vertNoel border-solid border-2 md:max-w-mid">
                    <div className="flex justify-around">
                        <QuestionMarkIcon className="-rotate-45 w-9 fill-vertNoel absolute top-0 left-0 md:relative" />
                        <h2 className="bg-vertNoel/25 rounded-lg p-2 self-center text-center text-lg font-bold">
                            Comment peut-on t&apos;aider ?
                        </h2>
                        <QuestionMarkIcon className="rotate-45 w-9 fill-rougeNoel absolute top-0 right-0 md:relative" />
                    </div>
                    <h3 className="pt-8 font-bold">Combien ça coûte?</h3>
                    <p>Le site est entièrement gratuit.</p>
                    <h3 className="pt-5 font-bold">Ai-je besoin d&apos;un mail ?</h3>
                    <p>
                        Non! Nous avons souhaité faire un site simple. Tu as juste besoin de connaitre ton nom de groupe, et ton
                        nom.
                    </p>
                    <h3 className="pt-5 font-bold">J&apos;ai oublié mon mot de passe administrateur!</h3>
                    <p>
                        Ah mince,
                        <Link href={'/contact'} className="px-2">
                            contacte
                        </Link>
                        nous rapidement pour pouvoir être débloqué!
                    </p>
                    <h3 className="pt-5 font-bold">Comment rajouter/supprimer des utilisateurs ?</h3>
                    <p>
                        Il faut être administrateur pour avoir ce droit. Si tu as un soucis, n&apos;hésite pas à nous
                        <Link href={'/contact'} className="pl-2">
                            contacter
                        </Link>
                    </p>{' '}
                    <CustomButton className="green-button mt-5" onClick={() => Router.push(connectedUser ? '/home' : '/')}>
                        Aller à l&apos;accueil
                    </CustomButton>
                </div>
            </div>
        </Layout>
    );
}
