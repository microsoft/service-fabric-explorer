import React from 'react';
import { ILoggedInAccounts } from '../../auth/aad';
import './aad-profile.scss';
import { logoutOfAad } from '../app';
export interface AadProfilesProps {
    accounts: ILoggedInAccounts[]
}

export default function AadProfiles(props: AadProfilesProps) {
    return (<div>
        {props.accounts.map(account => (<div key={account.tenant} className="aad-account">
            <div className='flex-between'>
                Tenant: {account.tenant}
            </div>
            <div>
                Account: {account.account.username}
            </div>
            <div className='flex'>
                <button className='simple-button logout-aad' onClick={() => logoutOfAad(account.tenant)}>Logout and Disconnect Clusters</button>
            </div>
        </div>
        ))}
    </div>)
}