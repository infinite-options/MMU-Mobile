# MMU-Mobile

Keystore files
Development mode uses debug.keystore

- debug.keystore is the default keystore file that is added everytime you delete the android folder and do an npx expo prebuild
- MMU.keystore is theoretically used for release mode but you actually have to go to Google since they replace that keystore file with a Release Keystore file. You have to run a command to get that SHA-1 certificate fingerprint and add it to GCP
