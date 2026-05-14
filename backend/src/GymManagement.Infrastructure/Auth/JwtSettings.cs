namespace GymManagement.Infrastructure.Auth;

public class JwtSettings
{
    public string Issuer { get; set; } = "GymManagement";
    public string Audience { get; set; } = "GymManagement.Web";
    public string Secret { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 480;
}
