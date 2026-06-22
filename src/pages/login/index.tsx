import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useUser, mockLogin, loginWithUserId, testUsers } from '@/store/UserContext';
import { showToast, showLoading, hideLoading, navigateBack, navigateTo } from '@/utils';

const LoginPage: React.FC = () => {
  const { login } = useUser();
  const [agreed, setAgreed] = useState(true);
  const router = useRouter();
  const redirect = router.params.redirect || '';

  const handleLoginSuccess = (userInfo: any, delay: number = 800) => {
    console.log('[LoginPage] 用户信息已写入全局状态:', userInfo.nickName);
    setTimeout(() => {
      if (redirect) {
        console.log('[LoginPage] 登录成功后跳转至:', redirect);
        navigateTo(redirect);
      } else {
        console.log('[LoginPage] 登录成功后返回上一页');
        navigateBack();
      }
    }, delay);
  };

  const handleWechatLogin = async () => {
    if (!agreed) {
      showToast('请先同意用户协议和隐私政策', 'none');
      return;
    }

    console.log('[LoginPage] 开始微信授权登录');
    showLoading('登录中...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userInfo = mockLogin();
      console.log('[LoginPage] 登录成功:', userInfo.nickName);
      login(userInfo);
      
      hideLoading();
      showToast('登录成功', 'success');
      
      handleLoginSuccess(userInfo, 1000);
    } catch (error) {
      console.error('[LoginPage] 登录失败:', error);
      hideLoading();
      showToast('登录失败，请重试', 'error');
    }
  };

  const handleTestLogin = async (userId: string) => {
    if (!agreed) {
      showToast('请先同意用户协议和隐私政策', 'none');
      return;
    }

    const userInfo = loginWithUserId(userId);
    if (!userInfo) {
      showToast('账号不存在', 'error');
      return;
    }

    showLoading('登录中...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    login(userInfo);
    hideLoading();
    showToast(`${userInfo.nickName} 登录成功`, 'success');
    
    handleLoginSuccess(userInfo, 800);
  };

  const handleAgreementClick = () => {
    setAgreed(!agreed);
  };

  return (
    <View className={styles.page}>
      <View className={styles.brandSection}>
        <View className={styles.logoCircle}>
          <Text>🧘</Text>
        </View>
        <Text className={styles.brandName}>梵音瑜伽</Text>
        <Text className={styles.brandSlogan}>ॐ 感受身心的宁静 ॐ</Text>
      </View>

      <View className={styles.loginSection}>
        <Text className={styles.welcomeTitle}>欢迎来到梵音瑜伽</Text>
        <Text className={styles.welcomeDesc}>登录后即可预约免费体验课</Text>

        <Button className={styles.loginBtn} onClick={handleWechatLogin}>
          <Text className={styles.wechatIcon}>💬</Text>
          <Text>微信一键登录</Text>
        </Button>

        <View className={styles.testAccounts}>
          <Text className={styles.testTitle}>测试账号（开发用）</Text>
          <View className={styles.testBtnList}>
            {Object.entries(testUsers).map(([id, user]) => (
              <Button
                key={id}
                className={classnames(styles.testBtn, id === 'user_123' && styles.testBtnActive)}
                onClick={() => handleTestLogin(id)}
              >
                <Text className={styles.testBtnName}>{user.nickName}</Text>
                <Text className={styles.testBtnId}>{id}</Text>
              </Button>
            ))}
          </View>
        </View>

        <View className={styles.phoneLogin}>
          <Text>其他登录方式：</Text>
          <Text className={styles.link} onClick={() => showToast('功能开发中')}>手机号登录</Text>
        </View>

        <View className={styles.agreement} onClick={handleAgreementClick}>
          <View
            className={classnames(
              styles.checkbox,
              agreed && styles.checkboxChecked
            )}
          />
          <Text className={styles.agreementText}>
            我已阅读并同意
            <Text className={styles.link}>《用户协议》</Text>
            和
            <Text className={styles.link}>《隐私政策》</Text>
            ，允许梵音瑜伽获取您的公开信息用于登录
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LoginPage;
