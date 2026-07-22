using GymManagement.Application.Interfaces;

namespace GymManagement.Api.Services;

public class ExpiryAlertBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpiryAlertBackgroundService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    public ExpiryAlertBackgroundService(IServiceScopeFactory scopeFactory, ILogger<ExpiryAlertBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var created = await notifications.GenerateExpiryAlertsAsync(stoppingToken);
                if (created > 0)
                    _logger.LogInformation("Generated {Count} membership expiry notifications", created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate membership expiry alerts");
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (TaskCanceledException) { }
        }
    }
}
