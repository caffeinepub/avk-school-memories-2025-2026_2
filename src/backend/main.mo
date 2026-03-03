import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Blob "mo:core/Blob";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile System
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Photo Gallery System
  public type Photo = {
    id : Nat;
    blobId : Storage.ExternalBlob;
    title : Text;
    caption : ?Text;
    uploadedAt : Time.Time;
  };

  // Session management for admin authentication
  public type SessionToken = Text;

  type AdminSession = {
    token : SessionToken;
    principal : Principal;
    createdAt : Time.Time;
  };

  let photos = Map.empty<Nat, Photo>();
  let adminSessions = Map.empty<SessionToken, AdminSession>();

  // Hardcoded admin credentials
  let adminUserId = "979174859";
  let adminPassword = "koushik@0705";

  var nextPhotoId : Nat = 1;
  var sessionCounter : Nat = 0;

  // Helper function to generate session token
  func generateSessionToken(caller : Principal) : SessionToken {
    sessionCounter += 1;
    let timestamp = Time.now();
    caller.toText() # "-" # sessionCounter.toText() # "-" # Int.abs(timestamp).toText();
  };

  // Helper function to validate session token
  func validateAdminSession(token : SessionToken) : Bool {
    switch (adminSessions.get(token)) {
      case null { false };
      case (?session) {
        // Session expires after 24 hours (in nanoseconds)
        let sessionAge = Time.now() - session.createdAt;
        let maxAge : Int = 24 * 60 * 60 * 1_000_000_000;
        sessionAge < maxAge;
      };
    };
  };

  // Helper function to get principal from session token
  func getPrincipalFromSession(token : SessionToken) : ?Principal {
    switch (adminSessions.get(token)) {
      case null { null };
      case (?session) { ?session.principal };
    };
  };

  // Admin login - returns session token
  public shared ({ caller }) func adminLogin(userId : Text, password : Text) : async SessionToken {
    if (userId != adminUserId) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    if (password != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };

    // Assign admin role to the caller
    AccessControl.assignRole(accessControlState, caller, caller, #admin);

    // Generate and store session token
    let token = generateSessionToken(caller);
    let session : AdminSession = {
      token;
      principal = caller;
      createdAt = Time.now();
    };
    adminSessions.add(token, session);

    token;
  };

  // Admin logout - invalidates session token
  public shared ({ caller }) func adminLogout(token : SessionToken) : async () {
    switch (getPrincipalFromSession(token)) {
      case null { Runtime.trap("Invalid session token"); };
      case (?principal) {
        if (principal != caller) {
          Runtime.trap("Unauthorized: Cannot logout another user's session");
        };
        adminSessions.remove(token);
      };
    };
  };

  // Check if a session token is valid (for frontend to verify)
  public query func validateSession(token : SessionToken) : async Bool {
    validateAdminSession(token);
  };

  // Add photo - requires valid admin session token
  public shared ({ caller }) func addPhoto(
    sessionToken : SessionToken,
    blobId : Storage.ExternalBlob,
    title : Text,
    caption : ?Text
  ) : async Nat {
    // Validate session token
    if (not validateAdminSession(sessionToken)) {
      Runtime.trap("Unauthorized: Invalid or expired session token");
    };

    // Verify the session belongs to the caller
    switch (getPrincipalFromSession(sessionToken)) {
      case null { Runtime.trap("Unauthorized: Invalid session token"); };
      case (?sessionPrincipal) {
        if (sessionPrincipal != caller) {
          Runtime.trap("Unauthorized: Session token does not match caller");
        };
      };
    };

    // Verify caller has admin permission
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add photos");
    };

    let id = nextPhotoId;
    nextPhotoId += 1;

    let photo : Photo = {
      id;
      blobId;
      title;
      caption;
      uploadedAt = Time.now();
    };

    photos.add(id, photo);
    id;
  };

  // Delete photo - requires valid admin session token
  public shared ({ caller }) func deletePhoto(sessionToken : SessionToken, photoId : Nat) : async () {
    // Validate session token
    if (not validateAdminSession(sessionToken)) {
      Runtime.trap("Unauthorized: Invalid or expired session token");
    };

    // Verify the session belongs to the caller
    switch (getPrincipalFromSession(sessionToken)) {
      case null { Runtime.trap("Unauthorized: Invalid session token"); };
      case (?sessionPrincipal) {
        if (sessionPrincipal != caller) {
          Runtime.trap("Unauthorized: Session token does not match caller");
        };
      };
    };

    // Verify caller has admin permission
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete photos");
    };

    if (not photos.containsKey(photoId)) {
      Runtime.trap("Photo does not exist");
    };

    photos.remove(photoId);
  };

  // Get all photos - public access (no authentication required)
  public query func getAllPhotos() : async [Photo] {
    photos.values().toArray();
  };

  // Get single photo by ID - public access
  public query func getPhoto(photoId : Nat) : async ?Photo {
    photos.get(photoId);
  };

  // Check if caller is admin (for UI purposes)
  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };
};
