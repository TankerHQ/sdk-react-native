import Tanker;

@objc
public class Utils: NSObject {
  @objc
  public static func dictToTankerVerification(dict: Dictionary<String, Any>) -> Verification? {
    if let passphrase = dict["passphrase"] as? String {
      return Verification(passphrase: passphrase)
    }
    if let email = dict["email"] as? String, let code = dict["verificationCode"] as? String {
      return Verification(email: email, verificationCode: code)
    }
    if let verificationKey = dict["verificationKey"] as? String {
      return Verification(verificationKey: VerificationKey(fromValue: verificationKey))
    }
    if let authCode = dict["oidcAuthorizationCode"] as? String,
       let providerId = dict["oidcProviderId"] as? String,
       let state = dict["oidcState"] as? String{
      return Verification(oidcAuthorizationCode: authCode, providerID: providerId, state: state)
    }
    if let oidcIDToken = dict["oidcIdToken"] as? String {
      return Verification(oidcIDToken: oidcIDToken)
    }
    if let phoneNumber = dict["phoneNumber"] as? String, let code = dict["verificationCode"] as? String {
      return Verification(phoneNumber: phoneNumber, verificationCode: code)
    }
    if let preverifiedEmail = dict["preverifiedEmail"] as? String {
      return Verification(preverifiedEmail: preverifiedEmail)
    }
    if let preverifiedPhoneNumber = dict["preverifiedPhoneNumber"] as? String {
      return Verification(preverifiedPhoneNumber: preverifiedPhoneNumber)
    }
    if let e2ePassphrase = dict["e2ePassphrase"] as? String {
      return Verification(e2ePassphrase: e2ePassphrase)
    }
    return nil;
  }

  @objc
  public static func dictToTankerVerificationOptions(dict: Dictionary<String, Any>?) -> VerificationOptions {
    var options = VerificationOptions();
    guard let dict = dict else {
      return options
    }
    
    if let withSessionToken = dict["withSessionToken"] as? NSNumber {
      options.withSessionToken = withSessionToken != 0;
    }
    if let allowE2eMethodSwitch = dict["allowE2eMethodSwitch"] as? NSNumber {
      options.allowE2eMethodSwitch = allowE2eMethodSwitch != 0;
    }
    return options;
  }
}
