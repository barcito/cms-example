import { useState, useEffect, createContext } from 'react';
import { useLocation } from 'react-router-dom';

export const NoteContext = createContext();

export const NoteContextProvider = ({ children }) => {

    const apiUrl = import.meta.env.VITE_API_URL;
    const location = useLocation();
    const [modalIsOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [modalNote, setModalNote] = useState({
        title: '',
        content: ''
    });

    const getNotes = async () => {
        const notesFromServer = await fetchNotes();
        setNotes(
            (location.pathname === '/archived' ?
                notesFromServer.filter( ( note ) => note.attributes.archived)
            :
                notesFromServer.filter( ( note ) => !note.attributes.archived))
        );
    }

    useEffect( () => {
        getNotes();
    }, [location]);

    const openNewModal = () => {
        setIsOpen(true);
    }

    const openEditModal = async (id) => {
        const noteToEdit = await fetchNote(id);
        setModalNote({
            id: noteToEdit.id,
            title: noteToEdit.title,
            content: noteToEdit.content
        })
        setIsOpen(true);
    }

    const closeModal = () => {
        setIsOpen(false);
        setModalNote({
            title: '',
            content: ''
        });
    }

    const fetchNotes = async () => {
        const res = await fetch(`${apiUrl}/notes`);
        const data = await res.json();
        return data.data;
    }

    const fetchNote = async (id) => {
        const res = await fetch(`${apiUrl}/notes/${id}`);
        const data = await res.json();
        return {...data.data.attributes, id: data.data.id};
    }

    const addNote = async (noteToSave) => {
        const res = await fetch(`${apiUrl}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({data: noteToSave})
        });

        const data = await res.json();
        setNotes([...notes, data.data]);
    }

    const deleteNote = async (id) => {
        const res = await fetch(`${apiUrl}/notes/${id}`, {
            method: 'DELETE'
        });
        res.status === 200
        ?
            setNotes(notes.filter((note) => note.id !== id ))
        :
            alert('Error deleting this note');
    }

    const editNote = async (id, noteToSave) => {
        const res = await fetch(`${apiUrl}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({data: noteToSave})
        });
        const data = await res.json();
        console.log(data);
        setNotes(
            notes.map((note) =>
                note.id === id ? data.data : note
            )
        );
    }

    const toggleArchived = async (id) => {
        const noteToToggle = await fetchNote(id);
        const updNote = { archived: !noteToToggle.archived };
        const res = await fetch(`${apiUrl}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({data: updNote})
        });
        res.status === 200 ? getNotes() : alert('Error editing this note');
    }

    return (
        <NoteContext.Provider value={{
            notes,
            onAdd: addNote,
            onDelete: deleteNote,
            onEdit: editNote,
            onToggle: toggleArchived,
            modalNote,
            modalIsOpen,
            openNewModal,
            openEditModal,
            closeModal
        }}>
            {children}
        </NoteContext.Provider>
    )
}