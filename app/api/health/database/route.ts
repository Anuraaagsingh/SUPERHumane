import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfig } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseConfig()
  
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      tables: {},
      errors: []
    }

    // Check if tables exist
    const tables = ['users', 'email_accounts', 'email_metadata', 'snippets']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          healthCheck.tables[table] = {
            exists: false,
            error: error.message,
            code: error.code
          }
          healthCheck.errors.push(`Table ${table}: ${error.message}`)
        } else {
          healthCheck.tables[table] = {
            exists: true,
            count: data?.length || 0
          }
        }
      } catch (err: any) {
        healthCheck.tables[table] = {
          exists: false,
          error: err.message
        }
        healthCheck.errors.push(`Table ${table}: ${err.message}`)
      }
    }

    // Determine overall status
    const allTablesExist = Object.values(healthCheck.tables).every((table: any) => table.exists)
    
    if (allTablesExist) {
      healthCheck.status = 'healthy'
    } else {
      healthCheck.status = 'unhealthy'
    }

    logger.info('Database health check completed', healthCheck)

    return NextResponse.json(healthCheck, {
      status: allTablesExist ? 200 : 503
    })

  } catch (error: any) {
    logger.error('Database health check failed', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      tables: {},
      errors: [error.message]
    }, { status: 500 })
  }
}
