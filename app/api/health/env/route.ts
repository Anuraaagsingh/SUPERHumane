import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      variables: {},
      errors: [],
      warnings: []
    }

    // Check required environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    const gmailVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ]

    const optionalVars = [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_SUPABASE_REDIRECT_URL'
    ]

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (!value) {
        envCheck.variables[varName] = { status: 'missing', value: null }
        envCheck.errors.push(`Required variable ${varName} is missing`)
      } else {
        envCheck.variables[varName] = { 
          status: 'set', 
          value: varName.includes('KEY') || varName.includes('SECRET') ? '***' : value.substring(0, 20) + '...'
        }
      }
    }

    // Check Gmail variables
    for (const varName of gmailVars) {
      const value = process.env[varName]
      if (!value) {
        envCheck.variables[varName] = { status: 'missing', value: null }
        envCheck.warnings.push(`Gmail OAuth variable ${varName} is missing - Gmail login will not work`)
      } else {
        envCheck.variables[varName] = { 
          status: 'set', 
          value: '***' // Never expose secrets
        }
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      const value = process.env[varName]
      envCheck.variables[varName] = { 
        status: value ? 'set' : 'not_set', 
        value: value ? value.substring(0, 50) + '...' : null
      }
    }

    // Determine overall status
    if (envCheck.errors.length > 0) {
      envCheck.status = 'error'
    } else if (envCheck.warnings.length > 0) {
      envCheck.status = 'warning'
    } else {
      envCheck.status = 'healthy'
    }

    return NextResponse.json(envCheck, {
      status: envCheck.status === 'error' ? 500 : 200
    })

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      variables: {},
      errors: [error.message]
    }, { status: 500 })
  }
}
