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
    let options = VerificationOptions();
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

  @objc
  public static func verificationMethodsToJson(methods: Array<VerificationMethod>) throws -> Array<Dictionary<String, Any>> {
    try methods.map({method in try Self.verificationMethodToJson(method: method)})
  }

  @objc
  public static func verificationMethodToJson(method: VerificationMethod) throws -> Dictionary<String, Any> {
    var dict = Dictionary<String, Any>()
    switch method.type {
    case .passphrase:
      dict["type"] = "passphrase"
    case .email:
      dict["type"] = "email"
      dict["email"] = method.email
    case .verificationKey:
      dict["type"] = "verificationKey"
    case .oidcidToken:
      dict["type"] = "oidcIdToken"
      dict["providerId"] = method.oidcProviderID
      dict["providerDisplayName"] = method.oidcProviderDisplayName
    case .phoneNumber:
      dict["type"] = "phoneNumber"
      dict["phoneNumber"] = method.phoneNumber
    case .preverifiedEmail:
      dict["type"] = "preverifiedEmail"
      dict["preverifiedEmail"] = method.preverifiedEmail
    case .preverifiedPhoneNumber:
      dict["type"] = "preverifiedPhoneNumber"
      dict["preverifiedPhoneNumber"] = method.preverifiedPhoneNumber
    case .e2ePassphrase:
      dict["type"] = "e2ePassphrase"
    case .preverifiedOIDC:
      // Can never happen (not returned by server)
      fallthrough
    case .oidcAuthorizationCode:
      // Can never happen (not returned by server)
      fallthrough
    @unknown default:
      throw NSError(domain: TKRErrorDomain, code: TKRError.internalError.rawValue, userInfo: [
        NSLocalizedDescriptionKey: "Unknown verification method type: \(method.type.rawValue)"
      ])
    }
    return dict
  }

  @objc(oidcAuthCodeDictFromVerif:)
  public static func oidcAuthCodeDictFromVerif(verif: Verification) -> Dictionary<String, Any>? {
    guard case .oidcAuthorizationCode(let verif) = verif.data else {
      // Should never happen
      return nil
    }
    return [
      "oidcAuthorizationCode": verif.authorizationCode,
      "oidcProviderId": verif.providerID,
      "oidcState": verif.state,
    ]
  }

  @objc
  public static func dictToTankerEncryptionOptions(dict: Dictionary<String, Any>?) -> EncryptionOptions {
    let options = EncryptionOptions();
    guard let dict = dict else {
      return options
    }

    if let shareWithUsers = dict["shareWithUsers"] as? Array<String> {
      options.shareWithUsers = shareWithUsers;
    }
    if let shareWithGroups = dict["shareWithGroups"] as? Array<String> {
      options.shareWithGroups = shareWithGroups;
    }
    if let shareWithSelf = dict["shareWithSelf"] as? NSNumber {
      options.shareWithSelf = shareWithSelf.boolValue;
    }
    if let paddingStep = dict["paddingStep"] as? NSNumber {
      switch paddingStep.uintValue {
      case 0: options.paddingStep = Padding.automatic()!
      case 1: options.paddingStep = Padding.off()!
      default: options.paddingStep = Padding.step(paddingStep.uintValue)!
      }
    }
    return options;
  }

  @objc
  public static func dictToTankerSharingOptions(dict: Dictionary<String, Any>?) -> SharingOptions {
    let options = SharingOptions();
    guard let dict = dict else {
      return options
    }

    if let shareWithUsers = dict["shareWithUsers"] as? Array<String> {
      options.shareWithUsers = shareWithUsers;
    }
    if let shareWithGroups = dict["shareWithGroups"] as? Array<String> {
      options.shareWithGroups = shareWithGroups;
    }
    return options;
  }
}
