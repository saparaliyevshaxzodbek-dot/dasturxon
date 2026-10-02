namespace Restaurant.Business;

/// <summary>The requested entity does not exist (HTTP 404).</summary>
public class NotFoundException(string message) : Exception(message);

/// <summary>The request breaks a business rule (HTTP 400).</summary>
public class BusinessRuleException(string message) : Exception(message);

/// <summary>The staff member's role doesn't allow the action (HTTP 403).</summary>
public class ForbiddenException(string message) : Exception(message);
