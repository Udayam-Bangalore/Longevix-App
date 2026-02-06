import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hp, wp } from '@/src/utils/responsive';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onEnable: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NotificationPermissionModal({
  visible,
  onClose,
  onEnable,
}: NotificationPermissionModalProps) {
  const benefits = [
    {
      icon: 'clock-outline',
      iconType: 'material-community',
      title: 'Meal Reminders',
      description: 'Get timely reminders to log your meals and stay on track',
    },
    {
      icon: 'trending-up',
      iconType: 'material-community',
      title: 'Nutrition Insights',
      description: 'Receive notifications about your nutrition goals and progress',
    },
    {
      icon: 'bell-outline',
      iconType: 'material-community',
      title: 'Daily Motivation',
      description: 'Stay motivated with helpful tips and encouragement',
    },
  ];

  const renderIcon = (iconName: string, iconType: string) => {
    const size = wp(5);
    switch (iconType) {
      case 'ionicons':
        return <Ionicons name={iconName as any} size={size} color="#0EA5E9" />;
      case 'material-community':
        return <MaterialCommunityIcons name={iconName} size={size} color="#0EA5E9" />;
      default:
        return <Ionicons name="notifications" size={size} color="#0EA5E9" />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hp(4) }}
          >
            {/* Icon and Title */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={wp(12)} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Stay on Track</Text>
              <Text style={styles.subtitle}>
                Enable notifications to get the most out of your nutrition journey
              </Text>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    {renderIcon(benefit.icon, benefit.iconType)}
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Enable Button */}
              <TouchableOpacity
                style={styles.enableButton}
                onPress={onEnable}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#0EA5E9', '#0284C7']}
                  style={styles.enableButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.enableButtonText}>Enable Notifications</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Maybe Later Button */}
              <TouchableOpacity
                style={styles.laterButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.laterButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleBar: {
    width: wp(12),
    height: 4,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: hp(1.5),
    borderRadius: wp(2),
  },
  closeButton: {
    position: 'absolute',
    top: hp(2),
    right: wp(4),
    zIndex: 1,
    padding: wp(2),
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6),
  },
  header: {
    alignItems: 'center',
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  iconContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: wp(6),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: wp(4),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: hp(2.5),
    paddingHorizontal: wp(4),
  },
  benefitsContainer: {
    marginVertical: hp(3),
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2.5),
    backgroundColor: '#F8FAFC',
    padding: wp(4),
    borderRadius: wp(3),
  },
  benefitIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: hp(0.5),
  },
  benefitDescription: {
    fontSize: wp(3.5),
    color: '#64748B',
    lineHeight: hp(2),
  },
  buttonsContainer: {
    paddingTop: hp(2),
    gap: hp(2),
  },
  enableButton: {
    borderRadius: wp(3),
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  enableButtonGradient: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  laterButton: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: wp(3),
  },
  laterButtonText: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: '#64748B',
  },
});