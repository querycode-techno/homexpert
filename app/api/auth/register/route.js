import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import client from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { name, email, password, phone, dateOfBirth, gender, requestedRole } = await request.json()

    // Input validation
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Phone validation
    const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Connect to MongoDB
    await client.connect()
    const db = client.db('homexpert')

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or phone' },
        { status: 409 }
      )
    }

    // Get appropriate role based on request
    const roleName = requestedRole === 'admin' ? 'admin' : 'user'
    const role = await db.collection('roles').findOne({ name: roleName })
    if (!role) {
      return NextResponse.json(
        { error: `${roleName} role not found` },
        { status: 500 }
      )
    }

    // For admin registration, you might want additional validation
    if (requestedRole === 'admin') {
      // Add any additional admin registration logic here
      // e.g., require admin invitation code, approval process, etc.
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique userId
    const prefix = 'HX'
    const timestamp = Date.now().toString().slice(-8)
    const userId = `${prefix}${timestamp}`

    // Prepare user data
    const userData = {
      userId,
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: role._id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      profile: {
        url: null,
        publicId: null,
        altText: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create user
    const result = await db.collection('users').insertOne(userData)

    // Return success response (exclude password)
    const { password: _, ...userResponse } = userData
    userResponse._id = result.insertedId

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: result.insertedId,
          userId: userResponse.userId,
          name: userResponse.name,
          email: userResponse.email,
          phone: userResponse.phone,
          role: role.name
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 