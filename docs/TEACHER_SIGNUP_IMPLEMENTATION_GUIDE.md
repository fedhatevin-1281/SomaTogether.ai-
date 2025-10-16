# Teacher Signup Implementation Guide

## Overview

This guide covers the comprehensive teacher signup system that collects all necessary information from the database schema and stores it properly. The implementation includes:

1. **Enhanced Teacher Signup Form** - Collects all required fields from the database schema
2. **Teacher Signup Service** - Handles data validation and database operations
3. **Database Setup Script** - Creates necessary functions, triggers, and policies
4. **Integration with Existing Auth System** - Seamlessly integrates with the current authentication flow

## Files Created/Modified

### New Files
- `src/components/teacher/TeacherSignupForm.tsx` - Comprehensive teacher signup form
- `src/services/teacherSignupService.ts` - Service for handling teacher signup data
- `setup-teacher-signup-database.sql` - Database setup script
- `TEACHER_SIGNUP_IMPLEMENTATION_GUIDE.md` - This guide

### Modified Files
- `src/components/auth/AuthScreen.tsx` - Added teacher signup integration

## Database Schema Coverage

The teacher signup form collects data for all relevant tables:

### Core Tables
- **`profiles`** - Basic user information (name, email, phone, bio, location, timezone, language)
- **`teachers`** - Teaching-specific information (hourly rate, experience, specialties, education, philosophy, languages, social links, TSC number)
- **`teacher_preferences`** - Teaching preferences (student ages, class duration, notifications, payment methods, profile visibility)
- **`teacher_skills`** - Teaching skills with proficiency levels and certifications
- **`teacher_subjects`** - Subjects taught with proficiency and experience
- **`teacher_availability`** - Weekly availability schedule
- **`teacher_documents`** - Document uploads (certificates, diplomas, etc.)
- **`teacher_onboarding_responses`** - Onboarding completion tracking
- **`wallets`** - Financial account for teachers

## Teacher Signup Form Features

### Multi-Tab Interface
1. **Basic Info** - Personal and contact information
2. **Teaching** - Teaching experience, philosophy, specialties, education, languages
3. **Preferences** - Teaching preferences, notifications, payment methods
4. **Skills** - Teaching skills with proficiency levels and certifications
5. **Availability** - Weekly schedule configuration

### Form Features
- **Dropdown Selections** - Timezone, language, currency, student ages, proficiency levels
- **Dynamic Lists** - Add/remove specialties, education, languages, skills
- **Availability Scheduler** - Configure weekly teaching hours
- **Validation** - Client-side and server-side validation
- **File Uploads** - Support for profile images and documents

### Data Validation
- Required fields validation
- Email format validation
- Numeric field validation (rates, experience years)
- Timezone validation
- Minimum skill requirements

## Database Functions Created

### Core Functions
- `create_teacher_preferences()` - Creates default preferences for new teachers
- `upload_teacher_document()` - Handles document uploads with metadata
- `update_teacher_profile()` - Updates teacher profile information
- `get_teacher_dashboard_data()` - Retrieves comprehensive teacher data
- `validate_teacher_signup_data()` - Validates signup data server-side

### Profile Completion Functions
- `calculate_teacher_profile_completion()` - Calculates profile completion percentage
- `get_teacher_profile_completion()` - Returns completion status and missing fields

### Triggers
- `create_teacher_preferences_trigger` - Auto-creates preferences and wallet for new teachers
- `notify_incomplete_profile_trigger` - Notifies teachers with incomplete profiles

## Integration with Auth System

### Signup Flow
1. User selects "Teacher" role in signup
2. System shows comprehensive teacher signup form
3. Form collects all necessary information
4. Creates auth user account
5. Creates comprehensive teacher profile in database
6. Sends verification email

### Backward Compatibility
- Simple signup still available for students
- Existing teacher accounts continue to work
- Gradual migration path for incomplete profiles

## Security Features

### Row Level Security (RLS)
- Teachers can only access their own data
- Public can view active teacher profiles
- Proper isolation between user data

### Data Validation
- Server-side validation of all inputs
- SQL injection prevention
- XSS protection through proper escaping

### File Upload Security
- File type validation
- File size limits (50MB)
- Secure storage with RLS policies

## Usage Instructions

### For Developers

1. **Run Database Setup**
   ```sql
   -- Execute the setup script
   \i setup-teacher-signup-database.sql
   ```

2. **Test Teacher Signup**
   - Go to signup page
   - Select "Teacher" role
   - Fill out the comprehensive form
   - Submit and verify data is stored correctly

3. **Verify Integration**
   - Check that teacher settings can edit all fields
   - Verify profile completion calculations
   - Test document uploads

### For Teachers

1. **Complete Registration**
   - Fill out all required fields
   - Add at least one teaching skill
   - Set availability schedule
   - Upload profile image (optional)

2. **Profile Completion**
   - System tracks completion percentage
   - Notifications for incomplete profiles
   - Guidance on missing fields

## Configuration Options

### Default Values
- Hourly rate: $25 USD
- Class duration: 60 minutes
- Max students per class: 1
- Timezone: UTC
- Language: English
- Profile visibility: Public

### Validation Rules
- Minimum hourly rate: $1
- Maximum experience years: 50
- Minimum class duration: 15 minutes
- Maximum students per class: 20
- Required skills: At least 1

## Error Handling

### Common Errors
- **Email already exists** - Handle duplicate email addresses
- **Invalid timezone** - Validate timezone selection
- **File upload failures** - Handle storage errors gracefully
- **Database constraints** - Handle foreign key violations

### User-Friendly Messages
- Clear error messages for validation failures
- Progress indicators during form submission
- Success confirmations with next steps

## Performance Considerations

### Database Indexes
- Indexed on frequently queried fields
- Optimized for teacher browsing queries
- Efficient profile completion calculations

### Caching
- Subject and education system data cached
- Profile completion status cached
- Availability data optimized for queries

## Future Enhancements

### Planned Features
- **Video Introduction** - Allow teachers to upload intro videos
- **Portfolio Gallery** - Showcase teaching materials
- **Calendar Integration** - Sync with external calendars
- **Multi-language Support** - Full internationalization
- **Advanced Scheduling** - Recurring patterns, exceptions

### Analytics
- Track signup completion rates
- Monitor profile completion trends
- Analyze teacher engagement metrics

## Troubleshooting

### Common Issues

1. **Form Not Loading**
   - Check component imports
   - Verify service dependencies
   - Check console for errors

2. **Database Errors**
   - Verify database setup script ran successfully
   - Check RLS policies are correctly configured
   - Ensure user has proper permissions

3. **File Upload Issues**
   - Verify storage buckets exist
   - Check RLS policies for storage
   - Ensure file size limits are appropriate

### Debug Steps

1. **Check Browser Console** - Look for JavaScript errors
2. **Verify Database Functions** - Test functions manually
3. **Check Network Tab** - Monitor API calls
4. **Review Server Logs** - Check for server-side errors

## Support

For issues or questions:
1. Check this guide first
2. Review the database schema
3. Test with sample data
4. Contact development team

## Conclusion

The comprehensive teacher signup system ensures that all necessary information is collected during registration and stored properly in the database. This provides a solid foundation for teacher profiles and enables better matching with students.

The system is designed to be:
- **User-friendly** - Intuitive form design with clear guidance
- **Comprehensive** - Collects all relevant information
- **Secure** - Proper validation and access controls
- **Scalable** - Efficient database design and queries
- **Maintainable** - Well-structured code and documentation


