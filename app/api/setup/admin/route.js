import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import client from '@/lib/db'

export async function POST(request) {
  try {
    const { name, email, password, phone } = await request.json()

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

    await client.connect()
    const db = client.db('homexpert')

    // Check if admin role exists
    const adminRole = await db.collection('roles').findOne({ name: 'admin' })
    if (!adminRole) {
      return NextResponse.json(
        { error: 'Admin role not found. Please seed the database first.' },
        { status: 500 }
      )
    }

    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ role: adminRole._id })
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists. Setup is complete.' },
        { status: 409 }
      )
    }

    // Check if email or phone is already taken
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique userId and employeeId for admin
    const timestamp = Date.now().toString().slice(-8)
    const userId = `HX${timestamp}`
    const employeeId = `EMP${timestamp}01`

    // Create admin user
    const adminUserData = {
      userId,
      employeeId,
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: adminRole._id,
      profileImage: null,
      address: {
        street: null,
        city: null,
        state: null,
        pincode: null,
        country: 'India'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('users').insertOne(adminUserData)

    // Return success response (exclude password)
    const { password: _, ...userResponse } = adminUserData
    userResponse._id = result.insertedId

    return NextResponse.json(
      {
        message: 'Admin user created successfully! You can now login.',
        user: {
          id: result.insertedId,
          userId: userResponse.userId,
          employeeId: userResponse.employeeId,
          name: userResponse.name,
          email: userResponse.email,
          phone: userResponse.phone,
          role: 'admin'
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 