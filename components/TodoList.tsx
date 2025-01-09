'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Header from './Header'
import Footer from './Footer'
import { db } from '@/lib/firebase'
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Todo[]
      setTodos(todosData)
    })

    return () => unsubscribe()
  }, [])

  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        await addDoc(collection(db, 'todos'), {
          text: newTodo,
          completed: false,
          createdAt: Date.now()
        })
        setNewTodo('')
      } catch (error) {
        console.error('Error adding todo:', error)
      }
    }
  }

  const updateTodo = async (id: string, newText: string) => {
    try {
      const todoRef = doc(db, 'todos', id)
      await updateDoc(todoRef, {
        text: newText
      })
      setEditingId(null)
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'todos', id))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const todoRef = doc(db, 'todos', id)
      await updateDoc(todoRef, {
        completed: !completed
      })
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex mb-4">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo"
              className="mr-2"
            />
            <Button onClick={addTodo}>Add</Button>
          </div>
          <ul className="space-y-2">
            {todos.map(todo => (
              <li key={todo.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id, todo.completed)}
                  className="h-4 w-4"
                />
                {editingId === todo.id ? (
                  <Input
                    type="text"
                    value={todo.text}
                    onChange={(e) => updateTodo(todo.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`flex-grow ${todo.completed ? 'line-through text-gray-500' : ''}`}
                    onDoubleClick={() => setEditingId(todo.id)}
                  >
                    {todo.text}
                  </span>
                )}
                <Button variant="destructive" size="sm" onClick={() => deleteTodo(todo.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}

