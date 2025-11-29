// screens/HomeScreen.js - Updated to show notifications for users

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation, currentUser, handleLogout, notifications, markNotificationsRead }) => {
    const [showNotifModal, setShowNotifModal] = useState(false);
    const userNotifications = notifications.filter(notif => notif.userId === currentUser.id && !notif.read);

    useEffect(() => {
        if (userNotifications.length > 0 && currentUser.role === 'user') {
            setShowNotifModal(true);
        }
    }, [userNotifications.length]);

    const handleCloseModal = () => {
        markNotificationsRead(currentUser.id);
        setShowNotifModal(false);
    };

    const renderNotification = ({ item }) => (
        <Text style={styles.notifItem}>{item.message}</Text>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bienvenido, {currentUser.username} ({currentUser.role})</Text>
            <Text style={styles.subtitle}>Gestiona tus libros fácilmente</Text>
            {currentUser.role === 'admin' && (
                <Button
                    title="Registrar Nuevo Libro"
                    onPress={() => navigation.navigate('RegisterBook')}
                />
            )}
            <Button
                title="Ver Lista de Libros"
                onPress={() => navigation.navigate('BookList')}
                color="green"
            />
            <Button title="Cerrar Sesión" onPress={handleLogout} color="red" />

            {/* Modal for user notifications */}
            <Modal
                visible={showNotifModal}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text>Notificaciones:</Text>
                        <FlatList
                            data={userNotifications}
                            renderItem={renderNotification}
                            keyExtractor={item => item.id}
                        />
                        <TouchableOpacity onPress={handleCloseModal}>
                            <Text style={styles.closeButton}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
    },
    notifItem: {
        marginBottom: 10,
    },
    closeButton: {
        color: 'blue',
        marginTop: 10,
    },
});

export default HomeScreen;