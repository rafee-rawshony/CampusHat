"""Seller Celery Tasks."""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='sellers.notify_admin_new_seller_application')
def notify_admin_new_seller_application(self, seller_id):
    """Notify admins of a new seller application."""
    from apps.sellers.models import SellerProfile
    try:
        seller = SellerProfile.objects.select_related('user').get(pk=seller_id)
        logger.info(
            'New seller application: %s (%s)', seller.business_name, seller.user.email,
        )
        
        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import notify_admins
            notify_admins(
                notification_type='seller',
                title='New Seller Application',
                message=f'New application for "{seller.business_name}" by {seller.user.full_name}.',
                action_url='/admin/review-center?tab=seller-applications'
            )
        except Exception as e:
            logger.warning(f"Failed to send platform notification for seller application: {e}")

    except SellerProfile.DoesNotExist:
        logger.error('Seller %s not found for notification.', seller_id)


@shared_task(bind=True, name='sellers.notify_seller_approval_result')
def notify_seller_approval_result(self, seller_id):
    """Notify seller of their approval/rejection."""
    from apps.sellers.models import SellerProfile
    try:
        seller = SellerProfile.objects.select_related('user').get(pk=seller_id)
        subject = 'Your seller application has been reviewed'
        if seller.status == 'approved':
            msg = (f'Hello {seller.user.full_name},\n\n'
                   f'Your seller application for "{seller.business_name}" has been approved!\n'
                   f'You can now create your store on CampusHat.')
        else:
            msg = (f'Hello {seller.user.full_name},\n\n'
                   f'Your seller application for "{seller.business_name}" has been '
                   f'{seller.status}.\nReason: {seller.rejection_reason or "N/A"}')
        send_mail(subject, msg, settings.DEFAULT_FROM_EMAIL,
                  [seller.user.email], fail_silently=True)

        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=seller.user,
                notification_type='seller',
                title='Seller Application Update',
                message=f'Your application for "{seller.business_name}" has been {seller.status}.',
                action_url='/account/seller'
            )
        except Exception as e:
            logger.warning(f"Failed to send seller approval platform notification: {e}")

    except Exception as e:
        logger.error('Seller notification error: %s', e)


@shared_task(bind=True, name='sellers.notify_store_approval_result')
def notify_store_approval_result(self, store_id):
    """Notify seller of their store approval/rejection."""
    from apps.sellers.models import Store
    try:
        store = Store.objects.select_related('seller__user').get(pk=store_id)
        user = store.seller.user
        if store.status == 'active':
            msg = f'Your store "{store.name}" is now live on CampusHat!'
        else:
            msg = f'Your store "{store.name}" has been {store.status}.'
        send_mail('Store Review Update', msg, settings.DEFAULT_FROM_EMAIL,
                  [user.email], fail_silently=True)

        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=user,
                notification_type='seller',
                title='Store Review Update',
                message=msg,
                action_url='/account/seller'
            )
        except Exception as e:
            logger.warning(f"Failed to send store approval platform notification: {e}")

    except Exception as e:
        logger.error('Store notification error: %s', e)


@shared_task(bind=True, name='sellers.notify_payout_processed')
def notify_payout_processed(self, payout_id):
    """Notify seller their payout was processed."""
    from apps.sellers.models import SellerPayoutRequest
    try:
        payout = SellerPayoutRequest.objects.select_related('seller__user').get(pk=payout_id)
        user = payout.seller.user
        msg = (f'Hello {user.full_name},\n\n'
               f'Your payout of {payout.amount} BDT via {payout.method} has been {payout.status}.')
        send_mail('Payout Update', msg, settings.DEFAULT_FROM_EMAIL,
                  [user.email], fail_silently=True)

        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=user,
                notification_type='payout',
                title='Payout Status Updated',
                message=f'Your payout of {payout.amount} BDT has been {payout.status}.',
                action_url='/account/seller/payouts'
            )
        except Exception as e:
            logger.warning(f"Failed to send payout platform notification: {e}")
    except Exception as e:
        logger.error('Payout notification error: %s', e)
