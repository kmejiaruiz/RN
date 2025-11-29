// screens/BookDetailScreen.js - Updated with stock check, timestamps, borrowUntil

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Replace with your actual Google Books API key
const GOOGLE_BOOKS_API_KEY = 'AIzaSyAsTGDiVPBVRy5zdMi-MLJ_JIbVqvgxd5I';

// Function to validate ISBN (10 or 13) - kept optional
const isValidISBN = (value) => {
    if (!value) return true; // Optional
    let isbn = value.replace(/[^\dX]/gi, ''); // Remove non-digits/X

    if (isbn.length === 10) {
        // ISBN-10 validation
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(isbn[i]) * (10 - i);
        }
        let check = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
        sum += check;
        return sum % 11 === 0;
    } else if (isbn.length === 13) {
        // ISBN-13 validation
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
        }
        let check = (10 - (sum % 10)) % 10;
        return check === parseInt(isbn[12]);
    }
    return false;
};

// Updated validation schema
const bookSchema = Yup.object().shape({
    title: Yup.string()
        .min(3, 'El título debe tener al menos 3 caracteres')
        .max(100, 'El título no puede exceder 100 caracteres')
        .required('El título es requerido'),
    author: Yup.string()
        .min(3, 'El autor debe tener al menos 3 caracteres')
        .max(100, 'El autor no puede exceder 100 caracteres')
        .required('El autor es requerido'),
    year: Yup.number()
        .integer('El año debe ser un número entero')
        .min(1000, 'El año debe ser al menos 1000')
        .max(new Date().getFullYear() + 1, `El año no puede ser mayor a ${new Date().getFullYear() + 1}`)
        .required('El año es requerido'),
    genre: Yup.string()
        .max(50, 'El género no puede exceder 50 caracteres')
        .optional(),
    isbn: Yup.string()
        .test('is-valid-isbn', 'ISBN inválido (debe ser ISBN-10 o ISBN-13 válido)', isValidISBN)
        .optional(),
});

const BookDetailScreen = ({ route, navigation, updateBook, deleteBook, currentUser, getUserById, addNotification }) => {
    const { book } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    const fetchBookByTitle = async (title) => {
        if (!title) {
            Alert.alert('Error', 'Por favor, ingresa un título para buscar.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=5`
            );
            const data = await response.json();

            if (data.totalItems > 0) {
                setSearchResults(data.items);
                setShowModal(true);
            } else {
                Alert.alert('No encontrado', 'No se encontró un libro con ese título en Google Books.');
            }
        } catch (error) {
            Alert.alert('Error', 'Falló la conexión con Google Books API. Verifica tu API key o conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectBook = (bookInfo, setFieldValue) => {
        setFieldValue('title', bookInfo.volumeInfo.title || '');
        setFieldValue('author', bookInfo.volumeInfo.authors ? bookInfo.volumeInfo.authors.join(', ') : '');
        setFieldValue('year', bookInfo.volumeInfo.publishedDate ? parseInt(bookInfo.volumeInfo.publishedDate.substring(0, 4), 10).toString() : '');
        setFieldValue('genre', bookInfo.volumeInfo.categories ? bookInfo.volumeInfo.categories[0] : '');
        setFieldValue('isbn', bookInfo.volumeInfo.industryIdentifiers ? bookInfo.volumeInfo.industryIdentifiers[0].identifier : '');
        setDataLoaded(true);
        setShowModal(false);
    };

    const renderResult = ({ item, setFieldValue }) => (
        <TouchableOpacity onPress={() => selectBook(item, setFieldValue)}>
            <View style={styles.resultItem}>
                <Text style={styles.resultTitle}>{item.volumeInfo.title}</Text>
                <Text>{item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Autor desconocido'}</Text>
                <Text>{item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.substring(0, 4) : 'Año desconocido'}</Text>
            </View>
        </TouchableOpacity>
    );

    const requestLoan = () => {
        if (book.status === 'available' && book.stock > 0) {
            updateBook({ ...book, status: 'requested', requestedBy: currentUser.id, requestedAt: new Date().toISOString() });
            Alert.alert('Préstamo solicitado', 'Tu solicitud ha sido enviada al admin.');
        } else {
            Alert.alert('No disponible', 'El libro no está disponible o no hay stock.');
        }
    };

    const returnBook = () => {
        if (book.borrowedBy === currentUser.id) {
            updateBook({ ...book, status: 'available', borrowedBy: null, stock: book.stock + 1, borrowUntil: null, approvedAt: null, approvedBy: null });
            Alert.alert('Libro devuelto', 'El libro ha sido devuelto exitosamente.');
        } else {
            Alert.alert('Error', 'No eres el prestatario de este libro.');
        }
    };

    const approveLoan = () => {
        if (book.stock > 0) {
            const now = new Date();
            const borrowUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
            updateBook({ ...book, status: 'borrowed', borrowedBy: book.requestedBy, requestedBy: null, stock: book.stock - 1, approvedAt: now.toISOString(), approvedBy: currentUser.id, borrowUntil: borrowUntil.toISOString() });
            addNotification(book.borrowedBy, `Préstamo aprobado por ${currentUser.username} el ${now.toLocaleString()}. Vigente hasta ${borrowUntil.toLocaleDateString()}.`);
        } else {
            alert('No hay stock disponible.');
        }
    };

    const rejectLoan = () => {
        updateBook({ ...book, status: 'available', requestedBy: null, requestedAt: null });
    };

    const forceReturn = () => {
        updateBook({ ...book, status: 'available', borrowedBy: null, stock: book.stock + 1, borrowUntil: null, approvedAt: null, approvedBy: null });
    };

    const handleDelete = () => {
        deleteBook(book.id);
        navigation.navigate('BookList');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Detalles del Libro</Text>
            <Text>Título: {book.title}</Text>
            <Text>Autor: {book.author}</Text>
            <Text>Año: {book.year}</Text>
            <Text>Género: {book.genre || 'N/A'}</Text>
            <Text>ISBN: {book.isbn || 'N/A'}</Text>
            <Text>Stock: {book.stock}</Text>
            <Text>Estado: {book.status}</Text>
            {book.status === 'requested' && book.requestedAt && (
                <Text>Solicitado el: {new Date(book.requestedAt).toLocaleString()} por {getUserById(book.requestedBy).username}</Text>
            )}
            {book.status === 'borrowed' && book.approvedAt && (
                <Text>Aprobado el: {new Date(book.approvedAt).toLocaleString()} por {getUserById(book.approvedBy).username}</Text>
            )}
            {book.borrowUntil && <Text>Vigente hasta: {new Date(book.borrowUntil).toLocaleDateString()}</Text>}

            {currentUser.role === 'admin' && (
                <Formik
                    initialValues={{
                        title: book.title,
                        author: book.author,
                        year: book.year.toString(),
                        genre: book.genre || '',
                        isbn: book.isbn || '',
                    }}
                    validationSchema={bookSchema}
                    onSubmit={(values) => {
                        updateBook({
                            id: book.id,
                            title: values.title,
                            author: values.author,
                            year: parseInt(values.year, 10),
                            genre: values.genre,
                            isbn: values.isbn,
                        });
                        navigation.goBack();
                    }}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                        <View>
                            <TextInput
                                style={styles.input}
                                onChangeText={handleChange('title')}
                                onBlur={handleBlur('title')}
                                value={values.title}
                                readOnly={dataLoaded}
                            />
                            {touched.title && errors.title && <Text style={styles.error}>{errors.title}</Text>}
                            <Button
                                title="Buscar en Google Books"
                                onPress={() => fetchBookByTitle(values.title)}
                                color="purple"
                            />
                            {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

                            <TextInput
                                style={styles.input}
                                onChangeText={handleChange('author')}
                                onBlur={handleBlur('author')}
                                value={values.author}
                                readOnly={dataLoaded}
                            />
                            {touched.author && errors.author && <Text style={styles.error}>{errors.author}</Text>}

                            <TextInput
                                style={styles.input}
                                onChangeText={handleChange('year')}
                                onBlur={handleBlur('year')}
                                value={values.year}
                                keyboardType="numeric"
                                readOnly={dataLoaded}
                            />
                            {touched.year && errors.year && <Text style={styles.error}>{errors.year}</Text>}

                            <TextInput
                                style={styles.input}
                                onChangeText={handleChange('genre')}
                                onBlur={handleBlur('genre')}
                                value={values.genre}
                                readOnly={dataLoaded}
                            />
                            {touched.genre && errors.genre && <Text style={styles.error}>{errors.genre}</Text>}

                            <TextInput
                                style={styles.input}
                                onChangeText={handleChange('isbn')}
                                onBlur={handleBlur('isbn')}
                                value={values.isbn}
                                readOnly={dataLoaded}
                            />
                            {touched.isbn && errors.isbn && <Text style={styles.error}>{errors.isbn}</Text>}

                            <Button title="Actualizar Libro" onPress={handleSubmit} />
                        </View>
                    )}
                </Formik>
            )}

            {/* User actions */}
            {currentUser.role === 'user' && book.status === 'available' && book.stock > 0 && (
                <Button title="Solicitar Préstamo" onPress={requestLoan} color="blue" />
            )}
            {currentUser.role === 'user' && book.borrowedBy === currentUser.id && (
                <Button title="Devolver Libro" onPress={returnBook} color="orange" />
            )}

            {/* Admin actions */}
            {currentUser.role === 'admin' && book.status === 'requested' && (
                <View>
                    <Button title="Aprobar Préstamo" onPress={approveLoan} color="green" />
                    <Button title="Rechazar Préstamo" onPress={rejectLoan} color="red" />
                </View>
            )}
            {currentUser.role === 'admin' && book.status === 'borrowed' && (
                <Button title="Forzar Devolución" onPress={forceReturn} color="orange" />
            )}
            {currentUser.role === 'admin' && <Button title="Eliminar Libro" onPress={handleDelete} color="red" />}

            {/* Modal for search results */}
            <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Resultados de Búsqueda</Text>
                    <FlatList
                        data={searchResults}
                        renderItem={({ item }) => renderResult({ item, setFieldValue })}
                        keyExtractor={item => item.id}
                    />
                    <Button title="Cancelar" onPress={() => setShowModal(false)} color="red" />
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    error: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
    },
    loader: {
        marginTop: 10,
        marginBottom: 10,
    },
    modalContainer: {
        flex: 1,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resultTitle: {
        fontWeight: 'bold',
    },
});

export default BookDetailScreen;