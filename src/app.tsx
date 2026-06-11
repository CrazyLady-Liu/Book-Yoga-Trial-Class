import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { UserProvider } from './store/UserContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] 小程序启动');
  }, []);

  useDidShow(() => {
    console.log('[App] 小程序显示');
  });

  useDidHide(() => {
    console.log('[App] 小程序隐藏');
  });

  return (
    <UserProvider>
      {props.children}
    </UserProvider>
  );
}

export default App;
