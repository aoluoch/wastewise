# Collector Application System - Quick Start Guide

## For Residents: How to Apply to Become a Collector

### Step 1: Access Your Dashboard
- Log in as a resident
- Navigate to your dashboard at `/resident/dashboard`

### Step 2: Find the Application Section
Look for the "Become a Waste Collector" card with:
- Green gradient background
- Benefits listed (flexible hours, competitive pay, community impact)
- Blue "Apply to Become a Collector" button

### Step 3: Fill Out the Application Form
When you click the button, a modal appears with:

**Required Fields:**
1. **County** - Select from dropdown (47 Kenyan counties available)
2. **Constituency** - Auto-populates based on your county selection

**Form Features:**
- County must be selected first
- Constituency dropdown becomes active after county selection
- Both fields are required
- Clear validation messages

### Step 4: Submit Application
- Click "Submit Application" button
- You'll see a success message
- The form closes automatically

### Step 5: Track Your Application Status

Your dashboard will now show one of these status banners:

#### 🔵 Pending (Blue Banner)
```
Application Pending
Your application to become a collector is currently under review. 
We'll notify you once an admin has reviewed your application.
```

#### 🟢 Approved (Green Banner)
```
🎉 Application Approved!
Congratulations! Your application to become a collector has been approved. 
Please log out and log back in to access your collector dashboard.
```

#### 🔴 Rejected (Red Banner)
```
Application Not Approved
Unfortunately, your collector application was not approved at this time. 
You can reapply using the form below.
```

### Step 6: After Approval
1. Log out of your account
2. Log back in
3. You'll now have access to the Collector Dashboard
4. Start accepting pickup tasks!

---

## For Admins: How to Review Applications

### Step 1: Access Admin Dashboard
- Log in as an admin
- Navigate to `/admin/dashboard`

### Step 2: Check for Pending Applications
Look for the "Collector Applications" quick action card:
- Shows 📝 icon
- Displays a **red badge** with the count of pending applications
- Located in the Quick Actions section

### Step 3: View All Applications
Click the "Collector Applications" button to see:

**Applications Table Columns:**
- **Applicant** - Full name
- **Contact** - Email and phone number
- **Location** - County and constituency
- **Applied On** - Date of application
- **Actions** - Approve/Reject buttons

### Step 4: Review Application Details
For each application, you can see:
- Applicant's full name
- Contact information (email, phone)
- Location details (county & constituency)
- When they applied

### Step 5: Make a Decision

#### To Approve:
1. Click the green "Approve" button
2. Confirm the action in the popup
3. User immediately becomes a collector
4. User receives notification
5. Application disappears from pending list

#### To Reject:
1. Click the red "Reject" button
2. A modal opens asking for an optional reason
3. Enter rejection reason (optional, max 500 characters)
4. Click "Reject Application"
5. User receives notification with reason
6. User can reapply later

### Step 6: Monitor Applications
- The applications page auto-refreshes every 30 seconds
- Badge count updates in real-time
- You'll see notifications for new applications

---

## Application States Explained

### 1. **None** (Initial State)
- User has never applied
- Shows the attractive "Become a Collector" card
- Displays benefits and call-to-action

### 2. **Pending** (Under Review)
- Application submitted and waiting for admin review
- Blue status banner on dashboard
- Cannot submit another application
- User receives notification when status changes

### 3. **Approved** (Accepted)
- Admin has approved the application
- Green success banner on dashboard
- User role changed to "collector"
- Must re-login to access collector features

### 4. **Rejected** (Declined)
- Admin has rejected the application
- Red status banner on dashboard
- Can reapply immediately
- Shows rejection reason if provided

---

## Location Data

### Available Counties (47 Total)
The system includes all 47 Kenyan counties:
- Nairobi, Mombasa, Kisumu, Nakuru, Kiambu
- Machakos, Kajiado, Uasin Gishu, Kakamega
- And 38 more...

### Constituencies (290+ Total)
Each county has its constituencies pre-loaded:
- **Example - Nairobi:** Westlands, Dagoretti North, Langata, Kibra, etc.
- **Example - Mombasa:** Changamwe, Jomvu, Kisauni, Nyali, etc.
- **Example - Kisumu:** Kisumu East, Kisumu West, Kisumu Central, etc.

---

## Notifications

### For Residents:
- **Application Submitted:** "Application submitted successfully! Please wait for admin approval."
- **Application Approved:** "Congratulations! Your application to become a collector has been approved."
- **Application Rejected:** Custom message with rejection reason (if provided)

### For Admins:
- **New Application:** Notification when a resident applies
- **Application Count:** Badge on dashboard showing pending count

---

## Common Questions

### Q: Can I apply multiple times?
**A:** No, you can only have one active application. If rejected, you can reapply.

### Q: How long does review take?
**A:** It depends on admin availability. You'll be notified immediately when reviewed.

### Q: What happens after approval?
**A:** Your account role changes to "collector". Log out and back in to access collector features.

### Q: Can I change my county/constituency after applying?
**A:** No, you'll need to wait for the application to be processed. If rejected, you can reapply with different information.

### Q: What if I don't see my constituency?
**A:** All Kenyan constituencies are included. Make sure you've selected the correct county first.

### Q: Can admins see rejected applications?
**A:** Currently, only pending applications are shown. Approved/rejected applications are tracked in the database.

---

## Troubleshooting

### Issue: "Apply" button doesn't work
**Solution:** Make sure you're logged in as a resident and haven't already applied.

### Issue: Constituencies not showing
**Solution:** Select a county first. The constituency dropdown is dependent on county selection.

### Issue: Form won't submit
**Solution:** Ensure both county and constituency are selected. Check for validation errors.

### Issue: Status not updating
**Solution:** Refresh the page or wait for the real-time update (Socket.io connection required).

### Issue: Can't see applications as admin
**Solution:** Ensure you're logged in as an admin and navigate to `/admin/applications`.

---

## Technical Details

### Frontend Routes:
- Resident Dashboard: `/resident/dashboard`
- Admin Applications: `/admin/applications`
- Admin Dashboard: `/admin/dashboard`

### API Endpoints:
- Apply: `POST /api/users/apply-for-collector`
- Get Applications: `GET /api/admin/collector-applications`
- Approve: `PUT /api/admin/collector-applications/:userId/approve`
- Reject: `PUT /api/admin/collector-applications/:userId/reject`

### Real-time Events:
- `application_approved` - Emitted when approved
- `application_rejected` - Emitted when rejected

---

## Best Practices

### For Residents:
1. ✅ Provide accurate location information
2. ✅ Check your notifications regularly
3. ✅ Re-login after approval to access collector features
4. ✅ If rejected, review the reason before reapplying

### For Admins:
1. ✅ Review applications promptly
2. ✅ Provide clear rejection reasons
3. ✅ Verify location information is reasonable
4. ✅ Check applicant's report history if available
5. ✅ Monitor the applications badge regularly

---

## Success Indicators

### System is Working When:
- ✅ Residents can see and submit the application form
- ✅ Status banners appear on resident dashboard
- ✅ Admins see pending applications count
- ✅ Approve/reject actions work instantly
- ✅ Notifications are sent to users
- ✅ Role changes after approval
- ✅ Real-time updates occur without page refresh

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Socket.io connection is active
3. Ensure backend server is running
4. Check database connectivity
5. Review server logs for API errors

For development issues, check:
- `/server/src/routes/admin.js` - Admin endpoints
- `/server/src/routes/users.js` - User endpoints
- `/client/src/components/CollectorApplicationForm.tsx` - Form component
- `/client/src/pages/admin/CollectorApplications.tsx` - Admin page
