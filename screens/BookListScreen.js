// screens/BookListScreen.js - Updated to show stock

import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';

const BookListScreen = ({ navigation, books, deleteBook, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    let filteredBooks = books;

    if (currentUser.role === 'user') {
        filteredBooks = books.filter(book => book.status === 'available' && book.stock > 0);
    }

    // Update filtered list with search
    const searchedBooks = searchQuery
        ? filteredBooks.filter(book =>
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (book.isbn && book.isbn.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : filteredBooks;

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.bookItem}
            onPress={() => navigation.navigate('BookDetail', { book: item })}
        >
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text>{item.author} ({item.year})</Text>
            {item.isbn && <Text>ISBN: {item.isbn}</Text>}
            <Text>Stock: {item.stock}</Text>
            <Text>Estado: {item.status}</Text>
            {currentUser.role === 'admin' && <Button title="Eliminar" color="red" onPress={() => deleteBook(item.id)} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lista de Libros</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar por título, autor o ISBN..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <FlatList
                data={searchedBooks}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text>No hay libros disponibles.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    bookItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    bookTitle: {
        fontWeight: 'bold',
    },
});

export default BookListScreen;