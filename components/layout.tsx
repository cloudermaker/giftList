import { ReactNode } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader } from './customHeader';

export const Layout = ({ children, withHeader = true} : { children: ReactNode; withHeader?: boolean }): JSX.Element => {
    return (
        <>
            <div className='m-10'>
                {withHeader && <CustomHeader />}

                {children}

            </div>

            <CustomFooter />
        </>
    )
}