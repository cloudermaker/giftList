import axios from 'axios';
import Router from 'next/router';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { GROUP_ID_COOKIE, Layout, USER_ID_COOKIE } from '../components/layout';
import { TGetOrCreateGroupAndUserResult } from './api/getOrCreateGroupAndUser';

export default function Index(): JSX.Element {
  const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
  const [joiningGroup, setJoiningGroup] = useState<boolean>(false);
  
  const [groupName, setGroupName] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onCreatingButtonClick = (): void => {
    setCreatingGroup(true);

    window.setTimeout(function () { 
      document.getElementById('groupNameInputId')?.focus(); 
    }, 0); 
  }

  const onJoiningButtonClick = (): void => {
    setJoiningGroup(true);

    window.setTimeout(function () { 
      document.getElementById('groupNameInputId')?.focus(); 
    }, 0);
  }

  const onCancelButtonClick = (): void => {
    setCreatingGroup(false);
    setJoiningGroup(false);
    setGroupName('');
    setName('');
    setError('');
  }

  const onValidateButtonClick = async (): Promise<void> => {
    if (!groupName) {
      setError('Group name is mandatory.');
    } else if (!name) {
      setError('Name is mandatory');
    } else {
      const res = await axios.post('api/getOrCreateGroupAndUser', { groupName, userName: name, isCreating: creatingGroup });
      const data = res.data as TGetOrCreateGroupAndUserResult;
      
      if (data.success && data.groupUser) {
        Cookies.set(GROUP_ID_COOKIE, data.groupUser.groupId, { expires: 7 });
        Cookies.set(USER_ID_COOKIE, data.groupUser.userId, { expires: 7 });

        Router.push('/home');
      } else {
        setError(data.error);
      }
    }
  }

  return (
    <Layout withHeader={false}>
      <h1>Welcome on the gift list site</h1>

      {!creatingGroup && !joiningGroup &&
        <div className='block'>
          <h3>What do you want to do ?</h3>

          <div className='flex'>
            <button onClick={onCreatingButtonClick}>Create a new group</button>

            <button onClick={onJoiningButtonClick}>Join an existing group</button>
          </div>
        </div>
      }

      {(creatingGroup || joiningGroup) &&
        <div className='block'>
          {error && <span className='text-red-500'>{`Error: ${error}`}</span>}

          <div className='flex'>
            <span>Enter a group name:</span>

            <input id="groupNameInputId" onChange={(e) => setGroupName(e.target.value)} value={groupName} />
          </div>

          <div className='flex'>
            <span>Enter a name:</span>

            <input id="nameInputId" onChange={(e) => setName(e.target.value)} value={name} />
          </div>

          <div className='flex'>
            <button onClick={onValidateButtonClick}>Validate</button>

            <button onClick={onCancelButtonClick}>Cancel</button>
          </div>
        </div>
      }
    </Layout>
  )
}
