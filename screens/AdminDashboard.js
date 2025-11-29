// screens/AdminDashboard.js - Updated to show requester, date/time, set borrowUntil, stock

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';

const AdminDashboard = ({ navigation, books, updateBook, currentUser, handleLogout, getUserById, addNotification }) => {
    const pendingRequests = books.filter(book => book.status === 'requested');

    const [showModal, setShowModal] = useState(false);
    const [borrowDuration, setBorrowDuration] = useState('7'); // Default 7 days

    useEffect(() => {
        if (pendingRequests.length > 0) {
            setShowModal(true);
        }
    }, [pendingRequests.length]);

    const approveRequest = (book) => {
        if (book.stock > 0) {
            const now = new Date();
            const borrowUntil = new Date(now);
            borrowUntil.setDate(now.getDate() + parseInt(borrowDuration, 10));
            updateBook({ ...book, status: 'borrowed', borrowedBy: book.requestedBy, requestedBy: null, stock: book.stock - 1, approvedAt: now.toISOString(), approvedBy: currentUser.id, borrowUntil: borrowUntil.toISOString() });
            addNotification(book.borrowedBy, `Préstamo aprobado por ${currentUser.username} el ${now.toLocaleString()}. Vigente hasta ${borrowUntil.toLocaleDateString()}.`);
        } else {
            alert('No hay stock disponible.');
        }
    };

    const rejectRequest = (book) => {
        updateBook({ ...book, status: 'available', requestedBy: null, requestedAt: null });
    };

    const renderRequest = ({ item }) => (
        <View style={styles.requestItem}>
            <Text>{item.title} (Stock: {item.stock})</Text>
            <Text>Solicitado por: {getUserById(item.requestedBy).username} el {new Date(item.requestedAt).toLocaleString()}</Text>
            <TextInput
                style={styles.input}
                placeholder="Días de préstamo"
                value={borrowDuration}
                onChangeText={setBorrowDuration}
                keyboardType="numeric"
            />
            <Button title="Aprobar" onPress={() => approveRequest(item)} color="green" />
            <Button title="Rechazar" onPress={() => rejectRequest(item)} color="red" />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel de Admin: {currentUser.username}</Text>
            <Button title="Ver Lista de Libros" onPress={() => navigation.navigate('BookList')} color="green" />
            <Button title="Registrar Libro" onPress={() => navigation.navigate('RegisterBook')} />
            <Text style={styles.subtitle}>Solicitudes Pendientes:</Text>
            <FlatList
                data={pendingRequests}
                renderItem={renderRequest}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text>No hay solicitudes pendientes.</Text>}
            />
            <Button title="Cerrar Sesión" onPress={handleLogout} color="red" />

            {/* Modal for notifications */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text>Hay {pendingRequests.length} solicitudes pendientes de préstamo.</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
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
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 10,
    },
    requestItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 5,
        marginBottom: 5,
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
    },
    closeButton: {
        color: 'blue',
        marginTop: 10,
    },
});

export default AdminDashboard;