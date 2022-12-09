import { ReactNode } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader, EHeader } from './customHeader';

export const Layout = ({ children, selectedHeader = EHeader.Homepage, withHeader = true} : { children: ReactNode; selectedHeader?: EHeader; withHeader?: boolean }): JSX.Element => {
    return (
        <>
            <div className='m-10'>
                {withHeader && <CustomHeader selectedHeader={selectedHeader} />}

                {children}

            </div>

            <CustomFooter />
        </>
    )
}