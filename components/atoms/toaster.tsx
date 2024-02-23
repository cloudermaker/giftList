import { toasterAtom } from '@/lib/jotai/toasterAtom';
import { useAtom } from 'jotai';
import { IconDefinition, faBan, faClose, faInfo, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Toaster = () => {
    const [toaster, setToaster] = useAtom(toasterAtom);

    if (!toaster.show) return null;

    const buildTitle = (): string => {
        if (toaster.type === 'information') return 'Information';
        if (toaster.type === 'warning') return 'Avertissement';
        return 'Erreur';
    };

    const buildIconDefinition = (): IconDefinition => {
        if (toaster.type === 'information') return faInfo;
        if (toaster.type === 'warning') return faWarning;
        return faBan;
    };

    return (
        <div className="absolute justify-center h-full w-full flex">
            <div className="h-full w-full absolute bg-black opacity-30" onClick={() => setToaster({ ...toaster, show: false })} />

            <div id="toast-interactive" className="absolute self-center p-4 text-gray-500 bg-white rounded-lg shadow">
                <div className="flex">
                    <div className="inline-flex self-center items-center justify-center flex-shrink-0 text-blue-500 bg-blue-100 rounded-lg p-4 m-4">
                        <FontAwesomeIcon icon={buildIconDefinition()} />
                    </div>
                    <div className="m-5">
                        <span className="mb-3 font-semibold text-gray-900">{buildTitle()}</span>
                        <div className="">{toaster.message ?? 'an error occured'}</div>
                    </div>
                    <button
                        type="button"
                        className="ms-auto -mx-1.5 -my-1.5 bg-white items-center justify-center flex-shrink-0 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
                        data-dismiss-target="#toast-interactive"
                        aria-label="Close"
                        onClick={() => setToaster({ ...toaster, show: false })}
                    >
                        <FontAwesomeIcon icon={faClose} />
                    </button>
                </div>
            </div>
        </div>
    );
};
