﻿﻿import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUser, defaultUserInfo } from '@/store/UserContext';
import { showToast, showModal, navigateBack } from '@/utils';

const PLACEHOLDER_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0U5RTVGRiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzNCIgZmlsbD0iIjdDNUNGRiIvPjxwYXRoIGQ9Ik00MCAxNzAgQzQwIDEzMCAxNjAgMTMwIDE2MCAxNzAgTDE2MCAyMDAgTDQwIDIwMCBaIiBmaWxsPSIjN0M1Q0ZGIi8+PC9zdmc+';

const AccountSettingsPage: React.FC = () => {
  const { userInfo, isLoggedIn, logout } = useUser();

  useDidShow(() => {
    console.log('[AccountSettingsPage] 页面显示, isLoggedIn:', isLoggedIn, 'userInfo:', userInfo?.nickName);
    if (!isLoggedIn) {
      showToast('请先登录', 'none');
      setTimeout(() => navigateBack(), 1000);
    }
  });

  const displayUserInfo = useMemo(() => {
    if (!userInfo) {
      return {
        ...defaultUserInfo,
        avatarUrl: PLACEHOLDER_AVATAR,
        nickName: '加载中...',
        phone: ''
      };
    }
    return {
      ...defaultUserInfo,
      ...userInfo,
      avatarUrl: userInfo.avatarUrl || PLACEHOLDER_AVATAR,
      nickName: userInfo.nickName || '未设置昵称'
    };
  }, [userInfo]);

  const handleEditProfile = () => {
    showToast('个人资料编辑功能开发中', 'none');
  };

  const handleAvatarClick = () => {
    showToast('头像更换功能开发中', 'none');
  };

  const handleAvatarError = () => {
    console.warn('[AccountSettingsPage] 头像加载失败，使用占位图');
  };

  const settingItems = useMemo(() => [
    {
      icon: '📱',
      text: '手机号',
      value: displayUserInfo.phone ? displayUserInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定',
      action: () => showToast('手机号更换功能开发中', 'none')
    },
    {
      icon: '🔒',
      text: '修改密码',
      value: '',
      action: () => showToast('密码修改功能开发中', 'none')
    },
    {
      icon: '👤',
      text: '性别',
      value: displayUserInfo.gender || '未设置',
      action: () => showToast('性别修改功能开发中', 'none')
    },
    {
      icon: '🎂',
      text: '生日',
      value: displayUserInfo.birthday || '未设置',
      action: () => showToast('生日修改功能开发中', 'none')
    }
  ], [displayUserInfo]);

  const securityItems = [
    { icon: '🛡️', text: '账号安全', desc: '登录设备、账号保护', action: () => showToast('账号安全功能开发中', 'none') },
    { icon: '🔔', text: '消息通知', desc: '预约提醒、优惠活动', action: () => showToast('消息通知设置开发中', 'none') },
    { icon: '🗑️', text: '清除缓存', desc: '释放本地存储空间', action: () => showToast('清除缓存功能开发中', 'none') }
  ];

  const otherItems = [
    { icon: '📞', text: '联系客服', action: () => showToast('联系客服功能开发中', 'none') },
    { icon: '📖', text: '关于我们', action: () => showToast('关于我们功能开发中', 'none') },
    { icon: '📄', text: '用户协议', action: () => showToast('用户协议功能开发中', 'none') },
    { icon: '🔐', text: '隐私政策', action: () => showToast('隐私政策功能开发中', 'none') }
  ];

  const handleLogout = async () => {
    console.log('[AccountSettingsPage] 点击退出登录');
    const confirmed = await showModal(
      '退出登录',
      '确定要退出登录吗？',
      { confirmText: '确定退出', cancelText: '取消' }
    );

    if (confirmed) {
      logout();
      showToast('已退出登录', 'success');
      setTimeout(() => navigateBack(), 1000);
    }
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '48rpx 32rpx' }}>
          <Text style={{ color: '#86909C' }}>请先登录...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>个人资料</Text>
          <View className={styles.profileHeader} onClick={handleEditProfile}>
            <View className={styles.avatarWrapper} onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}>
              <Image
                className={styles.avatarImg}
                src={displayUserInfo.avatarUrl}
                mode='aspectFill'
                onError={handleAvatarError}
              />
            </View>
            <View className={styles.profileInfo}>
              <Text className={styles.profileLabel}>昵称</Text>
              <Text className={styles.profileValue}>{displayUserInfo.nickName}</Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
          {settingItems.map((item, index) => (
            <View key={index} className={styles.settingItem} onClick={item.action}>
              <View className={styles.settingIcon}>{item.icon}</View>
              <View className={styles.settingContent}>
                <Text className={styles.settingText}>{item.text}</Text>
              </View>
              <View className={styles.settingRight}>
                {item.value && <Text className={styles.settingValue}>{item.value}</Text>}
                <Text className={styles.arrow}>›</Text>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>通用设置</Text>
          {securityItems.map((item, index) => (
            <View key={index} className={styles.settingItem} onClick={item.action}>
              <View className={styles.settingIcon}>{item.icon}</View>
              <View className={styles.settingContent}>
                <Text className={styles.settingText}>{item.text}</Text>
                <Text className={styles.settingDesc}>{item.desc}</Text>
              </View>
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>其他</Text>
          {otherItems.map((item, index) => (
            <View key={index} className={styles.settingItem} onClick={item.action}>
              <View className={styles.settingIcon}>{item.icon}</View>
              <View className={styles.settingContent}>
                <Text className={styles.settingText}>{item.text}</Text>
              </View>
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
        </View>

        <View className={styles.logoutSection}>
          <Button className={styles.logoutBtn} onClick={handleLogout}>
            退出登录
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

export default AccountSettingsPage;
