// screens/RegisterBookScreen.js - Updated to include stock input for admin

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Replace with your actual Google Books API key
const GOOGLE_BOOKS_API_KEY = 'yourapikey'; // Obtain from https://console.cloud.google.com/apis/library/books.googleapis.com

// Function to validate ISBN (10 or 13) - kept optional, but not used for search now
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

// Updated validation schema with stock
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
    stock: Yup.number()
        .integer('El stock debe ser un número entero')
        .min(1, 'El stock debe ser al menos 1')
        .required('El stock es requerido'),
});

const RegisterBookScreen = ({ navigation, addBook }) => {
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Formulario de Registro de Libro</Text>
            <Formik
                initialValues={{ title: '', author: '', year: '', genre: '', isbn: '', stock: '1' }}
                validationSchema={bookSchema}
                onSubmit={(values, { resetForm }) => {
                    addBook(values);
                    resetForm();
                    navigation.goBack();
                }}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                    <View>
                        <TextInput
                            style={styles.input}
                            placeholder="Título para buscar en Google Books"
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
                            placeholder="Autor"
                            onChangeText={handleChange('author')}
                            onBlur={handleBlur('author')}
                            value={values.author}
                            readOnly={dataLoaded}
                        />
                        {touched.author && errors.author && <Text style={styles.error}>{errors.author}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="Año de Publicación"
                            onChangeText={handleChange('year')}
                            onBlur={handleBlur('year')}
                            value={values.year}
                            keyboardType="numeric"
                            readOnly={dataLoaded}
                        />
                        {touched.year && errors.year && <Text style={styles.error}>{errors.year}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="Género (opcional)"
                            onChangeText={handleChange('genre')}
                            onBlur={handleBlur('genre')}
                            value={values.genre}
                            readOnly={dataLoaded}
                        />
                        {touched.genre && errors.genre && <Text style={styles.error}>{errors.genre}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="ISBN (opcional)"
                            onChangeText={handleChange('isbn')}
                            onBlur={handleBlur('isbn')}
                            value={values.isbn}
                            readOnly={dataLoaded}
                        />
                        {touched.isbn && errors.isbn && <Text style={styles.error}>{errors.isbn}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="Stock inicial (requerido, mínimo 1)"
                            onChangeText={handleChange('stock')}
                            onBlur={handleBlur('stock')}
                            value={values.stock}
                            keyboardType="numeric"
                        />
                        {touched.stock && errors.stock && <Text style={styles.error}>{errors.stock}</Text>}

                        <Button title="Registrar Libro" onPress={handleSubmit} />

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
                )}
            </Formik>
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

export default RegisterBookScreen;
