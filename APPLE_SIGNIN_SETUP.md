# Apple Sign-in Setup Guide

This guide explains how to set up Apple Sign-in for your React Native Expo app, focusing on both iOS native authentication and Android web-based authentication.

## Prerequisites

- An Apple Developer account
- Access to the Apple Developer portal
- Your app registered in the Apple Developer portal

## Step 1: Create an App ID

1. Go to the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Click the "+" button to add a new identifier
3. Select "App IDs" and click "Continue"
4. Select "App" as the type and click "Continue"
5. Enter a description (e.g., "MMU Apple Auth")
6. Enter your Bundle ID (e.g., "com.infiniteoptions.meetmeupapp")
7. Scroll down to "Capabilities" and enable "Sign In with Apple"
8. Click "Continue" and then "Register"

## Step 2: Create a Service ID

1. Go back to the Identifiers page
2. Click the "+" button to add a new identifier
3. Select "Services IDs" and click "Continue"
4. Enter a description (e.g., "MMU Sign In Service")
5. Enter a Service ID (e.g., "com.infiniteoptions.meetmeup.signin")
6. Click "Continue" and then "Register"
7. Click on the newly created Service ID
8. Enable "Sign In with Apple" and click "Configure"
9. Add your domain and redirect URLs:
   - For Domains: `auth.expo.io`
   - For Return URLs: `https://auth.expo.io/@pmarathay/meetmeup/redirect`
10. Click "Save" and then "Continue"
11. Click "Save" again to confirm the changes

## Step 3: Configure Your App

1. Add the Apple Service ID to your `.env` file:

   ```
   EXPO_PUBLIC_MMU_APPLE_SERVICE_ID=com.infiniteoptions.meetmeup.signin
   ```

2. Make sure your `app.json` has the following configuration for iOS:
   ```json
   "ios": {
     "usesAppleSignIn": true,
     ...
   }
   ```

## Step 4: Testing

### iOS Testing

- Apple Sign-in should work natively on iOS devices and simulators

### Android Testing

- On Android, the app will use web-based authentication
- Make sure your Service ID is properly configured with the correct redirect URL
- The web authentication flow should open a browser window for the user to sign in with their Apple ID

## Troubleshooting

### "invalid_client" Error

If you see an "invalid_client" error when testing on Android:

1. Verify that your Apple Service ID is correctly set up
2. Ensure the redirect URL is properly registered: `https://auth.expo.io/@pmarathay/meetmeup/redirect`
3. Make sure the domain `auth.expo.io` is added to your Service ID configuration

### Redirect URL Issues

If you see a blank page or "Not Found" page at the redirect URL after authentication:

1. This is expected behavior because:

   - Apple redirects to the specified redirect URL after successful authentication
   - The Expo authentication server at `auth.expo.io` doesn't have a proper handler for Apple Sign-in redirects
   - The browser shows a "Not Found" page because there's no content at that URL

2. How to handle this in your code:

   - When the user closes the browser after seeing the "Not Found" page, your app will receive a "dismiss" event
   - Treat this "dismiss" event as a successful authentication for testing purposes:

   ```javascript
   if (result.type === "success" || result.type === "dismiss") {
     // Assume authentication was successful
     // Create a mock user for testing
   }
   ```

3. For a production app, you should:
   - Set up your own backend server to handle the Apple authentication redirect
   - Configure a custom URL scheme for your app
   - Have your backend redirect back to your app using the custom URL scheme

### WebBrowser Session Errors

If you encounter WebBrowser session errors:

1. Make sure you're properly managing WebBrowser sessions in your code
2. Call `WebBrowser.maybeCompleteAuthSession()` at the top level of your component
3. Be aware that `WebBrowser.dismissAuthSession()` is only available on iOS, not on Android
   ```javascript
   // Platform-specific code
   if (Platform.OS === "ios") {
     try {
       await WebBrowser.dismissAuthSession();
     } catch (error) {
       console.log("Error dismissing auth session:", error);
     }
   }
   ```
4. Add a Linking event listener to capture redirect URLs:

   ```javascript
   const redirectListener = Linking.addEventListener("url", (event) => {
     console.log("Redirect URL received:", event.url);
   });

   // Don't forget to clean up
   redirectListener.remove();
   ```

## Production Implementation

For a production app, you should:

1. **Set up a custom redirect URL**: Instead of using the Expo authentication server, set up your own server to handle the redirect
2. **Implement a backend endpoint**: Create an endpoint that can:
   - Receive the authorization code from Apple
   - Exchange it for user information using the Apple API
   - Store user data in your database
   - Generate a token for your app
3. **Use a custom URL scheme**: Configure your app to handle a custom URL scheme that your backend can redirect to
4. **Handle deep linking**: Implement deep linking in your app to capture the authentication result

## Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/get-started/)
- [Expo Apple Authentication Documentation](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [React Native WebBrowser Documentation](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Linking Documentation](https://docs.expo.dev/versions/latest/sdk/linking/)
